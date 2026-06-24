import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { LineaProducto } from 'src/app/admin/models/productos/linea-producto';
import { GuardarLineaProductoRequestModel } from 'src/app/admin/models/productos/guardar-linea-producto-request';
import { LineasProductoService } from 'src/app/admin/services/lineas-producto.service';

/** Datos que recibe el diálogo al abrirse. */
export interface LineaFormData {
  linea?: LineaProducto;
  readonly?: boolean;
}

@Component({
  selector: 'app-linea-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, TranslatePipe],
  templateUrl: './linea-form-dialog.component.html',
})
export class LineaFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(LineasProductoService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<LineaFormDialogComponent>);
  readonly data = inject<LineaFormData>(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  readonly isEdit = !!this.data?.linea;
  readonly readonly = !!this.data?.readonly;

  readonly lineaForm = this.fb.group({
    descripcion: ['', [Validators.required, Validators.maxLength(50)]],
  });

  get titleKey(): string {
    if (this.readonly) return 'lineasProducto.form.titleView';
    return this.isEdit ? 'lineasProducto.form.titleEdit' : 'lineasProducto.form.titleAdd';
  }

  ngOnInit(): void {
    const l = this.data?.linea;
    if (l) {
      this.lineaForm.patchValue({ descripcion: l.descripcion });
    }
    if (this.readonly) {
      this.lineaForm.disable();
    }
  }

  guardar(): void {
    if (this.lineaForm.invalid) {
      this.lineaForm.markAllAsTouched();
      return;
    }

    const raw = this.lineaForm.getRawValue();
    const request = new GuardarLineaProductoRequestModel({
      idLineaProducto: this.data?.linea?.idLineaProducto ?? 0,
      descripcion: raw.descripcion ?? '',
      activo: this.data?.linea?.activo ?? true,
    });

    const peticion$ = this.isEdit
      ? this.service.actualizar(request.idLineaProducto, request)
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
            res?.mensaje ?? this.translate.instant('lineasProducto.msg.saveFallback'),
          );
        }
      },
      error: (err) => {
        console.error('Error al guardar línea de producto', err);
        this.notify.notify('error', this.translate.instant('lineasProducto.msg.saveError'));
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
