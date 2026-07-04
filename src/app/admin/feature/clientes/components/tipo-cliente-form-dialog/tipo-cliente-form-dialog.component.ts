import { Component, OnInit, inject, signal } from '@angular/core';
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
import { TipoCliente } from 'src/app/admin/models/clientes/tipo-cliente';
import { GuardarTipoClienteRequestModel } from 'src/app/admin/models/clientes/guardar-tipo-cliente-request';
import { TiposClienteService } from 'src/app/admin/services/tipos-cliente.service';

/** Datos que recibe el diálogo al abrirse. */
export interface TipoClienteFormData {
  tipo?: TipoCliente;
  readonly?: boolean;
}

@Component({
  selector: 'app-tipo-cliente-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, TranslatePipe],
  templateUrl: './tipo-cliente-form-dialog.component.html',
})
export class TipoClienteFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TiposClienteService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<TipoClienteFormDialogComponent>);
  readonly data = inject<TipoClienteFormData>(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  readonly isEdit = !!this.data?.tipo;
  readonly readonly = !!this.data?.readonly;

  readonly tipoClienteForm = this.fb.group({
    descripcion: ['', [Validators.required, Validators.maxLength(50)]],
    descuento: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  get titleKey(): string {
    if (this.readonly) return 'tiposCliente.form.titleView';
    return this.isEdit ? 'tiposCliente.form.titleEdit' : 'tiposCliente.form.titleAdd';
  }

  ngOnInit(): void {
    const t = this.data?.tipo;
    if (t) {
      this.tipoClienteForm.patchValue({
        descripcion: t.descripcion,
        descuento: t.descuento,
      });
    }
    if (this.readonly) {
      this.tipoClienteForm.disable();
    }
  }

  guardar(): void {
    if (this.tipoClienteForm.invalid) {
      this.tipoClienteForm.markAllAsTouched();
      return;
    }

    const raw = this.tipoClienteForm.getRawValue();
    const request = new GuardarTipoClienteRequestModel({
      idTipoCliente: this.data?.tipo?.idTipoCliente ?? 0,
      descripcion: raw.descripcion ?? '',
      descuento: raw.descuento ?? 0,
      activo: this.data?.tipo?.activo ?? true,
    });

    const peticion$ = this.isEdit
      ? this.service.actualizar(request.idTipoCliente, request)
      : this.service.crear(request);

    this.saving.set(true);
    peticion$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (res) => {
        if (res?.estatus === 200) {
          this.notify.notify('success', res.mensaje ?? '');
          this.dialogRef.close(
            new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, message: res.mensaje }),
          );
        } else {
          this.notify.notify(
            'error',
            res?.mensaje ?? this.translate.instant('tiposCliente.msg.saveFallback'),
          );
        }
      },
      error: (err) => {
        console.error('Error al guardar tipo de cliente', err);
        this.notify.notify('error', this.translate.instant('tiposCliente.msg.saveError'));
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
