import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { ProcesoProduccionAgranel } from 'src/app/admin/models/produccion-agranel/proceso-produccion-agranel';
import { AprobarProduccionAgranelRequestModel } from 'src/app/admin/models/produccion-agranel/aprobar-produccion-agranel-request';
import { ProduccionAgranelService } from 'src/app/admin/services/produccion-agranel.service';

/** Datos que recibe el diálogo al abrirse: el renglón pendiente a aprobar/rechazar. */
export interface AprobarFormData {
  proceso: ProcesoProduccionAgranel;
}

/**
 * Diálogo "Aprobar producción" (producción a granel). Migra el flujo móvil
 * aprobarProductosProduccionAgranel del legado: captura la cantidad atendida y observaciones
 * del renglón pendiente. El estatus final lo calcula la BD (0 = rechazo total; igual a la
 * solicitada = procesado; menor = rechazo parcial); la cantidad atendida no puede exceder la
 * solicitada (paridad con el SP, que lo valida con RAISERROR).
 */
@Component({
  selector: 'app-aprobar-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    TranslatePipe,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './aprobar-form-dialog.component.html',
})
export class AprobarFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProduccionAgranelService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<AprobarFormDialogComponent>);
  readonly data = inject<AprobarFormData>(MAT_DIALOG_DATA);

  readonly proceso = this.data.proceso;
  readonly saving = signal(false);

  readonly aprobarForm = this.fb.group({
    cantidadAtendida: [
      this.proceso.cantidad as number | null,
      [Validators.required, Validators.min(0), Validators.max(this.proceso.cantidad)],
    ],
    observaciones: ['' as string | null],
  });

  guardar(): void {
    if (this.aprobarForm.invalid) {
      this.aprobarForm.markAllAsTouched();
      return;
    }

    const raw = this.aprobarForm.getRawValue();
    const request = new AprobarProduccionAgranelRequestModel({
      idAlmacen: this.proceso.idAlmacen ?? 0,
      productos: [
        {
          idProcesoProduccionAgranel: this.proceso.idProcesoProduccionAgranel,
          idProducto: this.proceso.idProducto,
          idUbicacion: this.proceso.idUbicacion,
          cantidadAtendida: raw.cantidadAtendida ?? 0,
          observaciones: raw.observaciones || null,
        },
      ],
    });

    this.saving.set(true);
    this.service
      .aprobar(request)
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
          console.error('Error al aprobar la producción a granel', err);
          this.notify.notify('error', this.translate.instant('produccionAgranel.msg.saveError'));
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
