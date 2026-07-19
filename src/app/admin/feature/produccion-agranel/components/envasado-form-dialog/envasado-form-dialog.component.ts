import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable, finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { Producto } from 'src/app/admin/models/productos/producto';
import { AgregarEnvasadoLiquidosRequestModel } from 'src/app/admin/models/produccion-agranel/agregar-envasado-liquidos-request';
import { ProduccionAgranelService } from 'src/app/admin/services/produccion-agranel.service';
import { RelacionLiquidosService } from 'src/app/admin/services/relacion-liquidos.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';

/**
 * Diálogo "Registrar envasado" (líquidos). Migra el flujo móvil agregarLiquidosAInventario
 * del legado (AdminLiquidosController): producto envasado + cantidad + almacén. El SP valida
 * la relación envasado↔granel y el stock de granel/envases; aquí solo forma (regla 12). El
 * selector de producto reusa la búsqueda "envasar" de RelacionLiquidosService (regla 00).
 */
@Component({
  selector: 'app-envasado-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    TranslatePipe,
    SelectPaginadoComponent,
  ],
  templateUrl: './envasado-form-dialog.component.html',
})
export class EnvasadoFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProduccionAgranelService);
  private readonly relacionLiquidosService = inject(RelacionLiquidosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<EnvasadoFormDialogComponent>);

  readonly almacenes = signal<Catalogo[]>([]);
  readonly saving = signal(false);

  /** Productos envasables (líneas de envasado), búsqueda server-side paginada (regla 16). */
  readonly fetchEnvasados = (q: string, page: number): Observable<Producto[]> =>
    this.relacionLiquidosService.buscarProductos('envasar', q, page);

  readonly envasadoForm = this.fb.group({
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
    if (this.envasadoForm.invalid) {
      this.envasadoForm.markAllAsTouched();
      return;
    }

    const raw = this.envasadoForm.getRawValue();
    const request = new AgregarEnvasadoLiquidosRequestModel({
      idProducto: raw.idProducto ?? 0,
      cantidad: raw.cantidad ?? 0,
      idAlmacen: raw.idAlmacen ?? 0,
    });

    this.saving.set(true);
    this.service
      .agregarEnvasado(request)
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
          console.error('Error al registrar el envasado de líquidos', err);
          this.notify.notify('error', this.translate.instant('produccionAgranel.msg.saveError'));
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
