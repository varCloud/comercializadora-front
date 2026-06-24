import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize, forkJoin } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import {
  UbicacionImprimir,
  UbicacionImprimirModel,
} from 'src/app/admin/models/productos/ubicacion-imprimir';
import { UbicacionesService } from 'src/app/admin/services/ubicaciones.service';

/**
 * Generador de etiquetas QR de ubicaciones de almacén (migra la pantalla legada
 * Productos/Ubicaciones). El usuario arma una lista de ubicaciones (almacén/piso/pasillo/rack)
 * y genera un PDF con un QR por cada una. Sucursal fija Uruapan y bloqueada (regla 15).
 */
@Component({
  selector: 'app-imprimir-ubicaciones',
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    NgSelectModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
  ],
  templateUrl: './imprimir-ubicaciones.component.html',
  styleUrl: './imprimir-ubicaciones.component.scss',
})
export class ImprimirUbicacionesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(UbicacionesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('imprimirUbicaciones') blockUI!: NgBlockUI;

  readonly almacenes = signal<Catalogo[]>([]);
  readonly pisos = signal<Catalogo[]>([]);
  readonly pasillos = signal<Catalogo[]>([]);
  readonly racks = signal<Catalogo[]>([]);

  /** Ubicaciones que se incluirán en el PDF. */
  readonly filas = signal<UbicacionImprimir[]>([]);
  readonly generando = signal(false);

  readonly displayedColumns = ['posicion', 'almacen', 'piso', 'pasillo', 'rack', 'action'];

  /** Sucursal de operación (fija Uruapan, regla 15). Solo se muestra; bloqueada. */
  readonly sucursalNombre = CONSTANTS.SUCURSAL_DEFAULT.NOMBRE;

  readonly ubicacionForm = this.fb.group({
    idSucursal: [{ value: CONSTANTS.SUCURSAL_DEFAULT.ID, disabled: true }],
    idAlmacen: [null as number | null, Validators.required],
    idPiso: [null as number | null, Validators.required],
    idPasillo: [null as number | null, Validators.required],
    idRaq: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  private cargarCatalogos(): void {
    this.blockUI.start();
    forkJoin({
      almacenes: this.service.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID),
      pisos: this.service.obtenerPisos(),
      pasillos: this.service.obtenerPasillos(),
      racks: this.service.obtenerRacks(),
    })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => {
          this.almacenes.set(res.almacenes);
          this.pisos.set(res.pisos);
          this.pasillos.set(res.pasillos);
          this.racks.set(res.racks);
        },
        error: (err) => {
          console.error('Error al cargar catálogos de ubicaciones', err);
          this.notify.notify('error', this.translate.instant('productos.ubicaciones.msg.loadError'));
        },
      });
  }

  /** Agrega la combinación seleccionada a la tabla de ubicaciones a generar. */
  agregar(): void {
    if (this.ubicacionForm.invalid) {
      this.ubicacionForm.markAllAsTouched();
      this.notify.notify('warning', this.translate.instant('productos.ubicaciones.msg.completaCampos'));
      return;
    }

    const { idAlmacen, idPiso, idPasillo, idRaq } = this.ubicacionForm.getRawValue();

    const nueva = new UbicacionImprimirModel({
      idAlmacen: idAlmacen!,
      descripcionAlmacen: this.descripcion(this.almacenes(), idAlmacen),
      idPiso: idPiso!,
      descripcionPiso: this.descripcion(this.pisos(), idPiso),
      idPasillo: idPasillo!,
      descripcionPasillo: this.descripcion(this.pasillos(), idPasillo),
      idRaq: idRaq!,
      descripcionRaq: this.descripcion(this.racks(), idRaq),
    });

    const duplicada = this.filas().some(
      (f) =>
        f.idAlmacen === nueva.idAlmacen &&
        f.idPiso === nueva.idPiso &&
        f.idPasillo === nueva.idPasillo &&
        f.idRaq === nueva.idRaq,
    );
    if (duplicada) {
      this.notify.notify('warning', this.translate.instant('productos.ubicaciones.msg.duplicada'));
      return;
    }

    this.filas.update((f) => [...f, nueva]);
  }

  eliminar(index: number): void {
    this.filas.update((f) => f.filter((_, i) => i !== index));
  }

  limpiar(): void {
    this.filas.set([]);
  }

  /** Genera el PDF con un QR por ubicación y lo abre en una pestaña nueva. */
  generar(): void {
    if (this.filas().length === 0) {
      this.notify.notify('warning', this.translate.instant('productos.ubicaciones.msg.sinUbicaciones'));
      return;
    }

    this.generando.set(true);
    this.blockUI.start(this.translate.instant('productos.ubicaciones.msg.generando'));
    this.service
      .imprimir(this.filas())
      .pipe(
        finalize(() => {
          this.blockUI.stop();
          this.generando.set(false);
        }),
      )
      .subscribe({
        next: (blob) => this.abrirPdf(blob),
        error: (err) => {
          console.error('Error al generar el PDF de ubicaciones', err);
          this.notify.notify('error', this.translate.instant('productos.ubicaciones.msg.generarError'));
        },
      });
  }

  private abrirPdf(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Libera el objeto tras dar tiempo a que el visor lo cargue.
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  private descripcion(catalogo: Catalogo[], id: number | null): string {
    return catalogo.find((c) => c.id === id)?.descripcion ?? '';
  }
}
