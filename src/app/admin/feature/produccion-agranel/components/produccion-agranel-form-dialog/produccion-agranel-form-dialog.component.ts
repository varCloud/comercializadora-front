import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable, finalize, map } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { Producto } from 'src/app/admin/models/productos/producto';
import { AgregarProduccionAgranelRequestModel } from 'src/app/admin/models/produccion-agranel/agregar-produccion-agranel-request';
import { ProduccionAgranelService } from 'src/app/admin/services/produccion-agranel.service';
import { ProductosService } from 'src/app/admin/services/productos.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';

/** Línea MPL (materia prima líquida): única línea admitida por el SP de alta a producción. */
const LINEA_MPL = 12;

/**
 * Diálogo "Agregar a producción" (producción a granel). Migra el flujo móvil
 * agregarProductosProduccionAgranel del legado: producto de línea MPL + cantidad + almacén.
 * Las validaciones de inventario/línea las hace el SP; aquí solo se valida forma (regla 12).
 */
@Component({
  selector: 'app-produccion-agranel-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    TranslatePipe,
    SelectPaginadoComponent,
  ],
  templateUrl: './produccion-agranel-form-dialog.component.html',
})
export class ProduccionAgranelFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProduccionAgranelService);
  private readonly productosService = inject(ProductosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<ProduccionAgranelFormDialogComponent>);

  readonly almacenes = signal<Catalogo[]>([]);
  readonly saving = signal(false);

  /** Productos de la línea MPL, búsqueda server-side paginada (regla 16, >25 opciones). */
  readonly fetchMpl = (q: string, page: number): Observable<Producto[]> =>
    this.productosService
      .listar({ q, page, perPage: 25, idLineaProducto: LINEA_MPL })
      .pipe(map((res) => res.data));

  readonly produccionForm = this.fb.group({
    idProducto: [null as number | null, Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.01)]],
    idAlmacen: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    // Sucursal fija Uruapan (regla 15): la cascada de almacenes se dispara con el id fijo.
    this.usuariosService
      .obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID)
      .subscribe((a) => this.almacenes.set(a));
  }

  guardar(): void {
    if (this.produccionForm.invalid) {
      this.produccionForm.markAllAsTouched();
      return;
    }

    const raw = this.produccionForm.getRawValue();
    const request = new AgregarProduccionAgranelRequestModel({
      idProducto: raw.idProducto ?? 0,
      cantidad: raw.cantidad ?? 0,
      idAlmacen: raw.idAlmacen ?? 0,
    });

    this.saving.set(true);
    this.service
      .agregar(request)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify('success', res.mensaje ?? '');
            this.dialogRef.close(
              new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, message: res.mensaje }),
            );
          } else {
            this.notify.notify(
              'error',
              res?.mensaje ?? this.translate.instant('produccionAgranel.msg.saveFallback'),
            );
          }
        },
        error: (err) => {
          console.error('Error al agregar producto a producción a granel', err);
          this.notify.notify('error', this.translate.instant('produccionAgranel.msg.saveError'));
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
