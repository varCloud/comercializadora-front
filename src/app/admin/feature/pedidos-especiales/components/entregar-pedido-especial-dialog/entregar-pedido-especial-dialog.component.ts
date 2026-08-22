import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable, map } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { Cliente } from 'src/app/admin/models/clientes/cliente';
import { FormaPago, esFormaPagoTarjeta } from 'src/app/admin/models/ventas/forma-pago';
import { UsoCfdi } from 'src/app/admin/models/ventas/uso-cfdi';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';

/** Datos que recibe el diálogo al abrirse (folio + cliente del pedido + subtotal ya calculado). */
export interface EntregarPedidoEspecialDialogData {
  folio: number;
  cliente: Cliente | null;
  subtotal: number;
}

/**
 * Resultado que devuelve el diálogo al cerrarse con `ENUM_ESTATUS_MODAL.OK` (`ResultModalModel.data`).
 * El componente padre (`ConfirmarProductosComponent`) lo combina con las líneas de producto para
 * armar el body real de `GuardarConfirmacionRequest` — este diálogo NO conoce el contrato de la
 * API, solo captura "a quién se entrega + forma de pago" (ver nota de clase).
 */
export interface ResultadoEntregarPedidoEspecial {
  folio: number;
  entregadoACliente: boolean;
  entregadoARuteo: boolean;
  entregadoATaxi: boolean;
  idUsuarioRuteo: number | null;
  /** Solo informativo: el backend NUNCA usa este campo (`idUsuarioEntrega` siempre viene del JWT). */
  idUsuarioTaxi: number | null;
  numeroUnidadTaxi: string | null;
  observacionesPedidoRuta: string | null;
  idFormaPago: number;
  facturar: boolean;
  idUsoCFDI: number | null;
  tipoPago: 'liquidado' | 'credito' | 'creditoConAbono';
  subtotal: number;
  iva: number;
  total: number;
  efectivoRecibido: number;
  cambio: number;
}

/**
 * Diálogo "Entregar Pedido Especial" (Bloque B, FE-B3) — réplica de `#ModalEntregarPedidoEspecial`
 * + su lógica en `EvtConfirmarProductosV2.js` (`$('#btnGuardarPedidoEspecial')` /
 * `$('#btnEntregarPedidoEspecial')`). Se abre desde `ConfirmarProductosComponent.guardar()` tras
 * validar `validarProductosAceptados()`.
 *
 * Captura "a quién se entrega" (Cliente / Encargado de Ruteo / Taxi — checkboxes independientes
 * como el legado, se exige al menos uno) + forma de pago + facturar/uso CFDI + tipo de pago
 * (Liquidado / A Crédito / Crédito con Abono — el legado los deja como checkboxes pero la
 * lógica de guardado los trata como mutuamente excluyentes; aquí se modelan como
 * `mat-radio-group` para que la exclusividad sea explícita en la UI) + efectivo/cambio cuando
 * aplica.
 *
 * **Simplificaciones documentadas frente al legado** (fuera de alcance de este bloque, sin API
 * todavía): NO recalcula comisión bancaria ni descuento por tipo de cliente (dependen de
 * `ObtenerPrecios_`/config de sesión reales, ver TODO en `ConfirmarProductosComponent.subtotal`);
 * el total mostrado es `subtotal (+ IVA si factura)`. Los selectores de usuario de Ruteo/Taxi
 * reusan el catálogo genérico `UsuariosService` (regla 00): la API todavía no expone un filtro
 * por rol específico para "encargado de ruteo"/"taxi" como sí hacía el legado
 * (`listUsuariosRuteo`/`listUsuariosTaxi` separados en el ViewBag).
 */
@Component({
  selector: 'app-entregar-pedido-especial-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TranslatePipe, CurrencyPipe, SelectPaginadoComponent],
  templateUrl: './entregar-pedido-especial-dialog.component.html',
})
export class EntregarPedidoEspecialDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosService);
  private readonly pedidosEspecialesService = inject(PedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<EntregarPedidoEspecialDialogComponent>);
  readonly data = inject<EntregarPedidoEspecialDialogData>(MAT_DIALOG_DATA);

  readonly formasPago = signal<FormaPago[]>([]);
  readonly usoCfdiOpciones = signal<UsoCfdi[]>([]);
  readonly enviando = signal(false);

  readonly entregaForm = this.fb.group({
    entregadoACliente: [true],
    entregadoARuteo: [false],
    entregadoATaxi: [false],
    idUsuarioRuteo: [null as number | null],
    idUsuarioTaxi: [null as number | null],
    numeroUnidadTaxi: [''],
    observacionesPedidoRuta: [''],
    idFormaPago: [null as number | null, Validators.required],
    facturar: [false],
    idUsoCFDI: [null as number | null],
    tipoPago: [null as 'liquidado' | 'credito' | 'creditoConAbono' | null, Validators.required],
    efectivo: [null as number | null],
  });

  readonly entregadoARuteoValue = toSignal(this.entregaForm.controls.entregadoARuteo.valueChanges, {
    initialValue: this.entregaForm.controls.entregadoARuteo.value,
  });
  readonly entregadoATaxiValue = toSignal(this.entregaForm.controls.entregadoATaxi.valueChanges, {
    initialValue: this.entregaForm.controls.entregadoATaxi.value,
  });
  readonly facturarValue = toSignal(this.entregaForm.controls.facturar.valueChanges, {
    initialValue: this.entregaForm.controls.facturar.value,
  });
  readonly tipoPagoValue = toSignal(this.entregaForm.controls.tipoPago.valueChanges, {
    initialValue: this.entregaForm.controls.tipoPago.value,
  });
  private readonly idFormaPagoValue = toSignal(this.entregaForm.controls.idFormaPago.valueChanges, {
    initialValue: this.entregaForm.controls.idFormaPago.value,
  });
  private readonly efectivoValue = toSignal(this.entregaForm.controls.efectivo.valueChanges, {
    initialValue: this.entregaForm.controls.efectivo.value,
  });

  private readonly formaPagoSeleccionada = computed(() =>
    this.formasPago().find((f) => f.id === this.idFormaPagoValue()),
  );

  /** Réplica de `formaPago != 4 && != 18` (tarjeta crédito/débito) del legado. */
  readonly requiereEfectivo = computed(
    () =>
      (this.tipoPagoValue() === 'liquidado' || this.tipoPagoValue() === 'creditoConAbono') &&
      !esFormaPagoTarjeta(this.formaPagoSeleccionada()),
  );

  readonly iva = computed(() => (this.facturarValue() ? this.round2(this.data.subtotal * 0.16) : 0));

  readonly total = computed(() => this.round2(this.data.subtotal + this.iva()));

  readonly cambio = computed(() => {
    const efectivo = Number(this.efectivoValue() ?? 0);
    const total = this.total();
    return efectivo > total ? this.round2(efectivo - total) : 0;
  });

  /** fetchPage para los selectores paginados de usuario (regla 16) — catálogo genérico, ver nota de clase. */
  readonly fetchUsuarios = (q: string, page: number): Observable<unknown[]> =>
    this.usuariosService.buscarPaginado(q, page);

  constructor() {
    this.pedidosEspecialesService.obtenerFormasPago().subscribe({
      next: (lista) => this.formasPago.set(lista),
      error: (err) => {
        console.error('Error al cargar las formas de pago', err);
        this.notify.notify(
          'error',
          this.translate.instant('pedidosEspeciales.entregarPedidoDialog.msg.errorFormasPago'),
        );
      },
    });
    this.pedidosEspecialesService.obtenerUsosCfdi().subscribe({
      next: (lista) => this.usoCfdiOpciones.set(lista),
      error: (err) => {
        console.error('Error al cargar los usos de CFDI', err);
        this.notify.notify(
          'error',
          this.translate.instant('pedidosEspeciales.entregarPedidoDialog.msg.errorUsoCfdi'),
        );
      },
    });
  }

  /** Réplica de `$('#chkFacturar').click()`: al desmarcar, limpia el uso de CFDI elegido. */
  onFacturarChange(checked: boolean): void {
    if (!checked) {
      this.entregaForm.controls.idUsoCFDI.setValue(null);
    }
  }

  onEntregadoARuteoChange(checked: boolean): void {
    if (!checked) {
      this.entregaForm.controls.idUsuarioRuteo.setValue(null);
      this.entregaForm.controls.observacionesPedidoRuta.setValue('');
    }
  }

  onEntregadoATaxiChange(checked: boolean): void {
    if (!checked) {
      this.entregaForm.controls.idUsuarioTaxi.setValue(null);
      this.entregaForm.controls.numeroUnidadTaxi.setValue('');
    }
  }

  /** Botón "Aceptar" (réplica de `$('#btnEntregarPedidoEspecial').click`). Doble-submit bloqueado. */
  aceptar(): void {
    if (this.enviando()) return;

    const raw = this.entregaForm.getRawValue();

    if (!raw.entregadoACliente && !raw.entregadoARuteo && !raw.entregadoATaxi) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.entregarPedidoDialog.msg.destinatarioRequerido'),
      );
      return;
    }
    if (raw.entregadoARuteo && !raw.idUsuarioRuteo) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.entregarPedidoDialog.msg.usuarioRuteoRequerido'),
      );
      return;
    }
    if (raw.entregadoATaxi && !raw.idUsuarioTaxi) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.entregarPedidoDialog.msg.usuarioTaxiRequerido'),
      );
      return;
    }
    if (!raw.idFormaPago) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.entregarPedidoDialog.msg.formaPagoRequerida'),
      );
      return;
    }
    if (raw.facturar && !raw.idUsoCFDI) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.entregarPedidoDialog.msg.usoCfdiRequerido'),
      );
      return;
    }
    if (!raw.tipoPago) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.entregarPedidoDialog.msg.tipoPagoRequerido'),
      );
      return;
    }

    const totalFinal = this.total();
    const efectivoRecibido = this.requiereEfectivo() ? Number(raw.efectivo ?? 0) : totalFinal;

    if (this.requiereEfectivo() && !raw.efectivo) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.entregarPedidoDialog.msg.efectivoRequerido'),
      );
      return;
    }
    if (raw.tipoPago === 'liquidado' && efectivoRecibido < totalFinal) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.entregarPedidoDialog.msg.efectivoInsuficiente', {
          total: totalFinal,
        }),
      );
      return;
    }

    this.enviando.set(true);

    const resultado: ResultadoEntregarPedidoEspecial = {
      folio: this.data.folio,
      entregadoACliente: !!raw.entregadoACliente,
      entregadoARuteo: !!raw.entregadoARuteo,
      entregadoATaxi: !!raw.entregadoATaxi,
      idUsuarioRuteo: raw.entregadoARuteo ? raw.idUsuarioRuteo : null,
      idUsuarioTaxi: raw.entregadoATaxi ? raw.idUsuarioTaxi : null,
      numeroUnidadTaxi: raw.entregadoATaxi ? raw.numeroUnidadTaxi : null,
      observacionesPedidoRuta: raw.entregadoARuteo ? raw.observacionesPedidoRuta : null,
      idFormaPago: Number(raw.idFormaPago),
      facturar: !!raw.facturar,
      idUsoCFDI: raw.facturar ? raw.idUsoCFDI : null,
      tipoPago: raw.tipoPago,
      subtotal: this.data.subtotal,
      iva: this.iva(),
      total: totalFinal,
      efectivoRecibido,
      cambio: this.cambio(),
    };

    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, data: resultado }));
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }

  private round2(n: number): number {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }
}
