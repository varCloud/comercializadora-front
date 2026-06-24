import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import {
  ENUM_ESTATUS_MODAL,
  ResultModalModel,
} from 'src/app/models/result-modal';
import { Proveedor } from 'src/app/admin/models/proveedores/proveedor';
import { GuardarProveedorRequestModel } from 'src/app/admin/models/proveedores/guardar-proveedor-request';
import { ProveedoresService } from 'src/app/admin/services/proveedores.service';

/** Datos que recibe el diálogo al abrirse. */
export interface ProveedorFormData {
  proveedor?: Proveedor;
  readonly?: boolean;
}

@Component({
  selector: 'app-proveedor-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, TranslatePipe],
  templateUrl: './proveedor-form-dialog.component.html',
})
export class ProveedorFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProveedoresService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<ProveedorFormDialogComponent>);
  readonly data = inject<ProveedorFormData>(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  readonly isEdit = !!this.data?.proveedor;
  readonly readonly = !!this.data?.readonly;

  readonly form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: ['', Validators.required],
    telefono: ['', Validators.required],
    direccion: ['', Validators.required],
  });

  get titleKey(): string {
    if (this.readonly) return 'proveedores.form.titleView';
    return this.isEdit ? 'proveedores.form.titleEdit' : 'proveedores.form.titleAdd';
  }

  constructor() {
    const p = this.data?.proveedor;
    if (p) {
      this.form.patchValue({
        nombre: p.nombre,
        descripcion: p.descripcion,
        telefono: p.telefono,
        direccion: p.direccion,
      });
    }
    if (this.readonly) {
      this.form.disable();
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request = new GuardarProveedorRequestModel({
      idProveedor: this.data?.proveedor?.idProveedor ?? 0,
      nombre: raw.nombre ?? '',
      descripcion: raw.descripcion ?? '',
      telefono: raw.telefono ?? '',
      direccion: raw.direccion ?? '',
      activo: this.data?.proveedor?.activo ?? true,
    });

    const peticion$ = this.isEdit
      ? this.service.actualizar(request.idProveedor, request)
      : this.service.crear(request);

    this.saving.set(true);
    peticion$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (res) => {
        if (res?.estatus === 200) {
          this.notify.notify('success', res.mensaje ?? '');
          this.dialogRef.close(
            new ResultModalModel({
              status: ENUM_ESTATUS_MODAL.OK,
              message: res.mensaje,
            }),
          );
        } else {
          this.notify.notify(
            'error',
            res?.mensaje ?? this.translate.instant('proveedores.msg.saveFallback'),
          );
        }
      },
      error: (err) => {
        console.error('Error al guardar proveedor', err);
        this.notify.notify('error', this.translate.instant('proveedores.msg.saveError'));
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(
      new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }),
    );
  }
}
