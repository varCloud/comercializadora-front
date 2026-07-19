import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { GuardarInventarioFisicoRequestModel } from 'src/app/admin/models/inventario-fisico/guardar-inventario-fisico-request';
import { InventarioFisicoService } from 'src/app/admin/services/inventario-fisico.service';

/**
 * Diálogo "Crear Inventario Físico". Migra el modal modalNuevoInventarioFisico del legado:
 * solo pide el Nombre (obligatorio, "El nombre no puede ir vacio"). El alta queda en
 * estatus 1 "Pendiente"; el que abre recarga el listado si el resultado es OK.
 */
@Component({
  selector: 'app-inventario-fisico-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TranslatePipe],
  templateUrl: './inventario-fisico-form-dialog.component.html',
})
export class InventarioFisicoFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(InventarioFisicoService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<InventarioFisicoFormDialogComponent>);

  readonly saving = signal(false);

  readonly inventarioForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(300)]],
  });

  guardar(): void {
    if (this.inventarioForm.invalid) {
      this.inventarioForm.markAllAsTouched();
      return;
    }

    const request = new GuardarInventarioFisicoRequestModel({
      nombre: (this.inventarioForm.value.nombre ?? '').trim(),
    });

    this.saving.set(true);
    this.service
      .crear(request)
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
              res?.mensaje ?? this.translate.instant('inventarioFisico.msg.saveFallback'),
            );
          }
        },
        error: (err) => {
          console.error('Error al crear el inventario físico', err);
          this.notify.notify('error', this.translate.instant('inventarioFisico.msg.saveError'));
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
