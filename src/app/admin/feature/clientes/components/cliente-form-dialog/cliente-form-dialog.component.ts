import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import {
  ENUM_ESTATUS_MODAL,
  ResultModalModel,
} from 'src/app/models/result-modal';
import { Cliente } from 'src/app/admin/models/clientes/cliente';
import { GuardarClienteRequestModel } from 'src/app/admin/models/clientes/guardar-cliente-request';
import { TipoCliente } from 'src/app/admin/models/clientes/tipo-cliente';
import { RegimenFiscal } from 'src/app/admin/models/clientes/regimen-fiscal';
import { ClientesService } from 'src/app/admin/services/clientes.service';

/** Datos que recibe el diálogo al abrirse. */
export interface ClienteFormData {
  cliente?: Cliente;
  readonly?: boolean;
}

const PHONE_PATTERN = /^\d{10}$/;

@Component({
  selector: 'app-cliente-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, TranslatePipe, NgSelectModule],
  templateUrl: './cliente-form-dialog.component.html',
})
export class ClienteFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ClientesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<ClienteFormDialogComponent>);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = inject<ClienteFormData>(MAT_DIALOG_DATA);

  readonly tipos = signal<TipoCliente[]>([]);
  readonly regimenes = signal<RegimenFiscal[]>([]);

  readonly saving = signal(false);
  readonly isEdit = !!this.data?.cliente;
  readonly readonly = !!this.data?.readonly;

  /** Refleja el toggle física/moral para condicionar el template. */
  readonly esMoral = signal(false);

  readonly clienteForm = this.fb.group({
    // ------- Tipo de persona + datos generales -------
    esPersonaMoral: [false],
    nombres: ['', [Validators.required, Validators.maxLength(250)]],
    apellidoPaterno: ['', [Validators.required, Validators.maxLength(50)]],
    apellidoMaterno: ['', Validators.maxLength(50)],
    razonSocial: ['', Validators.maxLength(250)],
    sociedadMercantil: ['', Validators.maxLength(50)],
    // ------- Domicilio -------
    calle: ['', Validators.maxLength(50)],
    numeroExterior: ['', Validators.maxLength(50)],
    numeroInterior: ['', Validators.maxLength(20)],
    colonia: ['', Validators.maxLength(50)],
    localidad: ['', Validators.maxLength(250)],
    municipio: ['', Validators.maxLength(50)],
    estado: ['', Validators.maxLength(50)],
    cp: ['', [Validators.required, Validators.maxLength(50)]],
    // ------- Fiscales -------
    rfc: ['', Validators.maxLength(50)],
    idTipoCliente: [null as number | null, Validators.required],
    idRegimenFiscal: [null as number | null, Validators.required],
    // ------- Contacto -------
    telefono: ['', Validators.pattern(PHONE_PATTERN)],
    correo: ['', [Validators.email, Validators.maxLength(50)]],
    nombreContacto: ['', Validators.maxLength(250)],
    // ------- Pedidos especiales -------
    latitud: ['', Validators.maxLength(250)],
    longitud: ['', Validators.maxLength(250)],
    usarDatosCliente: [false],
    nombreContactoPE: ['', Validators.maxLength(250)],
    telefonoContactoPE: ['', Validators.pattern(PHONE_PATTERN)],
    correoContactoPE: ['', [Validators.email, Validators.maxLength(50)]],
    // ------- Crédito -------
    diasCredito: [0, Validators.min(0)],
    montoMaximoCredito: [0, Validators.min(0)],
  });

  get titleKey(): string {
    if (this.readonly) return 'clientes.form.titleView';
    return this.isEdit ? 'clientes.form.titleEdit' : 'clientes.form.titleAdd';
  }

  ngOnInit(): void {
    this.service.catalogoTipos().subscribe((t) => this.tipos.set(t));
    this.service.catalogoRegimenes().subscribe((r) => this.regimenes.set(r));

    // Validación condicional física/moral (paridad con el DTO del back).
    this.clienteForm.controls.esPersonaMoral.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((esMoral) => this.aplicarValidacionPersona(!!esMoral));

    // "Usar datos del cliente": copia los datos de contacto al bloque de pedidos especiales.
    this.clienteForm.controls.usarDatosCliente.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((usar) => this.aplicarUsarDatosCliente(!!usar));

    const c = this.data?.cliente;
    if (c) {
      this.clienteForm.patchValue({
        esPersonaMoral: c.esPersonaMoral,
        nombres: c.nombres,
        apellidoPaterno: c.apellidoPaterno,
        apellidoMaterno: c.apellidoMaterno,
        razonSocial: c.razonSocial,
        sociedadMercantil: c.sociedadMercantil,
        calle: c.calle,
        numeroExterior: c.numeroExterior,
        numeroInterior: c.numeroInterior,
        colonia: c.colonia,
        localidad: c.localidad,
        municipio: c.municipio,
        estado: c.estado,
        cp: c.cp,
        rfc: c.rfc,
        idTipoCliente: c.idTipoCliente > 0 ? c.idTipoCliente : null,
        idRegimenFiscal: c.idRegimenFiscal > 0 ? c.idRegimenFiscal : null,
        telefono: c.telefono,
        correo: c.correo,
        nombreContacto: c.nombreContacto,
        latitud: c.latitud,
        longitud: c.longitud,
        usarDatosCliente: c.usarDatosCliente,
        nombreContactoPE: c.nombreContactoPE,
        telefonoContactoPE: c.telefonoContactoPE,
        correoContactoPE: c.correoContactoPE,
        diasCredito: c.diasCredito,
        montoMaximoCredito: c.montoMaximoCredito,
      });
    }

    if (this.readonly) {
      this.clienteForm.disable({ emitEvent: false });
      this.esMoral.set(!!c?.esPersonaMoral);
    }
  }

  /**
   * Física: nombres + apellido paterno requeridos. Moral: razón social + RFC requeridos.
   * Además limpia los campos del modo contrario (valor + estado touched) para no arrastrar
   * datos/errores ocultos al cambiar el toggle. En edición es seguro: patchValue emite
   * esPersonaMoral antes de asignar los demás campos, así que no pisa los valores cargados.
   */
  private aplicarValidacionPersona(esMoral: boolean): void {
    this.esMoral.set(esMoral);
    const { nombres, apellidoPaterno, apellidoMaterno, razonSocial, sociedadMercantil, rfc } =
      this.clienteForm.controls;

    if (esMoral) {
      nombres.removeValidators(Validators.required);
      apellidoPaterno.removeValidators(Validators.required);
      razonSocial.addValidators(Validators.required);
      rfc.addValidators(Validators.required);
      nombres.reset('', { emitEvent: false });
      apellidoPaterno.reset('', { emitEvent: false });
      apellidoMaterno.reset('', { emitEvent: false });
    } else {
      nombres.addValidators(Validators.required);
      apellidoPaterno.addValidators(Validators.required);
      razonSocial.removeValidators(Validators.required);
      rfc.removeValidators(Validators.required);
      razonSocial.reset('', { emitEvent: false });
      sociedadMercantil.reset('', { emitEvent: false });
    }

    nombres.updateValueAndValidity({ emitEvent: false });
    apellidoPaterno.updateValueAndValidity({ emitEvent: false });
    razonSocial.updateValueAndValidity({ emitEvent: false });
    rfc.updateValueAndValidity({ emitEvent: false });
  }

  /** Copia teléfono/correo/nombre de contacto del cliente al contacto de pedidos especiales. */
  private aplicarUsarDatosCliente(usar: boolean): void {
    if (this.readonly) return;
    const { nombreContactoPE, telefonoContactoPE, correoContactoPE } = this.clienteForm.controls;

    if (usar) {
      const raw = this.clienteForm.getRawValue();
      const nombreCliente = raw.esPersonaMoral
        ? (raw.razonSocial ?? '')
        : `${raw.nombres ?? ''} ${raw.apellidoPaterno ?? ''}`.trim();
      nombreContactoPE.setValue(raw.nombreContacto || nombreCliente);
      telefonoContactoPE.setValue(raw.telefono ?? '');
      correoContactoPE.setValue(raw.correo ?? '');
      nombreContactoPE.disable({ emitEvent: false });
      telefonoContactoPE.disable({ emitEvent: false });
      correoContactoPE.disable({ emitEvent: false });
    } else {
      nombreContactoPE.enable({ emitEvent: false });
      telefonoContactoPE.enable({ emitEvent: false });
      correoContactoPE.enable({ emitEvent: false });
    }
  }

  guardar(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    const raw = this.clienteForm.getRawValue();
    const esMoral = !!raw.esPersonaMoral;
    const request = new GuardarClienteRequestModel({
      idCliente: this.data?.cliente?.idCliente ?? 0,
      esPersonaMoral: esMoral,
      // El back resuelve el mapeo física/moral; se manda solo lo que aplica al tipo de persona.
      nombres: esMoral ? null : raw.nombres || null,
      apellidoPaterno: esMoral ? null : raw.apellidoPaterno || null,
      apellidoMaterno: esMoral ? null : raw.apellidoMaterno || null,
      razonSocial: esMoral ? raw.razonSocial || null : null,
      sociedadMercantil: esMoral ? raw.sociedadMercantil || null : null,
      rfc: raw.rfc || null,
      telefono: raw.telefono || null,
      correo: raw.correo || null,
      calle: raw.calle || null,
      numeroExterior: raw.numeroExterior || null,
      numeroInterior: raw.numeroInterior || null,
      colonia: raw.colonia || null,
      localidad: raw.localidad || null,
      municipio: raw.municipio || null,
      estado: raw.estado || null,
      cp: raw.cp || null,
      nombreContacto: raw.nombreContacto || null,
      latitud: raw.latitud || null,
      longitud: raw.longitud || null,
      nombreContactoPE: raw.nombreContactoPE || null,
      telefonoContactoPE: raw.telefonoContactoPE || null,
      correoContactoPE: raw.correoContactoPE || null,
      usarDatosCliente: !!raw.usarDatosCliente,
      diasCredito: raw.diasCredito ?? 0,
      montoMaximoCredito: raw.montoMaximoCredito ?? 0,
      idTipoCliente: raw.idTipoCliente ?? 0,
      idRegimenFiscal: raw.idRegimenFiscal ?? 0,
    });

    const peticion$ = this.isEdit
      ? this.service.actualizar(request.idCliente, request)
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
            res?.mensaje ?? this.translate.instant('clientes.msg.saveFallback'),
          );
        }
      },
      error: (err) => {
        console.error('Error al guardar cliente', err);
        this.notify.notify('error', this.translate.instant('clientes.msg.saveError'));
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
