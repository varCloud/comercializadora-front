import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import {
  ENUM_ESTATUS_MODAL,
  ResultModalModel,
} from 'src/app/models/result-modal';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Estacion } from 'src/app/admin/models/estaciones/estacion';
import { GuardarEstacionRequestModel } from 'src/app/admin/models/estaciones/guardar-estacion-request';
import { EstacionesService } from 'src/app/admin/services/estaciones.service';

/** Datos que recibe el diálogo al abrirse. */
export interface EstacionFormData {
  estacion?: Estacion;
  /** Solo lectura (modo "ver"). */
  readonly?: boolean;
}

@Component({
  selector: 'app-estacion-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, TranslatePipe],
  templateUrl: './estacion-form-dialog.component.html',
})
export class EstacionFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EstacionesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<EstacionFormDialogComponent>);
  readonly data = inject<EstacionFormData>(MAT_DIALOG_DATA);

  readonly sucursales = signal<Catalogo[]>([]);
  readonly almacenes = signal<Catalogo[]>([]);
  readonly saving = signal(false);

  readonly isEdit = !!this.data?.estacion;
  readonly readonly = !!this.data?.readonly;

  readonly form = this.fb.group({
    nombre: ['', Validators.required],
    numero: [0, Validators.min(1)],
    // Sucursal fija en Uruapan y bloqueada (regla 15).
    idSucursal: [{ value: CONSTANTS.SUCURSAL_DEFAULT.ID, disabled: true }, Validators.min(1)],
    idAlmacen: [{ value: 0, disabled: true }, Validators.min(1)],
  });

  get titleKey(): string {
    if (this.readonly) return 'estaciones.form.titleView';
    return this.isEdit ? 'estaciones.form.titleEdit' : 'estaciones.form.titleAdd';
  }

  ngOnInit(): void {
    this.service.obtenerSucursales().subscribe((s) => this.sucursales.set(s));

    const e = this.data?.estacion;
    if (e) {
      this.form.patchValue({ nombre: e.nombre, numero: e.numero });
      // Sucursal fija (regla 15): carga los almacenes de Uruapan y selecciona el de la estación.
      this.cargarAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID, e.idAlmacen);
    } else {
      this.cargarAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID);
    }

    if (this.readonly) {
      this.form.disable();
    }
  }

  onSucursalChange(idSucursal: number): void {
    this.form.controls.idAlmacen.setValue(0);
    this.cargarAlmacenes(idSucursal);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request = new GuardarEstacionRequestModel({
      idEstacion: this.data?.estacion?.idEstacion ?? 0,
      nombre: raw.nombre ?? '',
      numero: raw.numero ?? 0,
      idAlmacen: raw.idAlmacen ?? 0,
      // mac/configurado los gestiona la estación: en edición se conservan, en alta van vacíos.
      macAdress: this.data?.estacion?.macAdress ?? null,
      configurado: this.data?.estacion?.configurado ?? false,
    });

    const peticion$ = this.isEdit
      ? this.service.actualizar(request.idEstacion, request)
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
            res?.mensaje ?? this.translate.instant('estaciones.msg.saveFallback'),
          );
        }
      },
      error: (err) => {
        console.error('Error al guardar estación', err);
        this.notify.notify('error', this.translate.instant('estaciones.msg.saveError'));
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(
      new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }),
    );
  }

  private cargarAlmacenes(idSucursal: number, seleccionado?: number): void {
    const control = this.form.controls.idAlmacen;
    if (!idSucursal || idSucursal <= 0) {
      this.almacenes.set([]);
      control.disable();
      return;
    }
    this.service.obtenerAlmacenes(idSucursal).subscribe((a) => {
      this.almacenes.set(a);
      if (!this.readonly) {
        control.enable();
      }
      if (seleccionado) {
        control.setValue(seleccionado);
      }
    });
  }
}
