import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { SesionService } from 'src/app/services/sesion.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { imprimirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';
import { DetalleCuentaPorCobrar } from 'src/app/admin/models/pedidos-especiales/detalle-cuenta-por-cobrar';
import { RealizarAbonoRequestModel } from 'src/app/admin/models/pedidos-especiales/realizar-abono-request';
import { FormaPago, esFormaPagoEfectivo, esFormaPagoTarjeta } from 'src/app/admin/models/ventas/forma-pago';
import { TipoIngresoPedidoEspecialId } from 'src/app/admin/models/pedidos-especiales/tipo-ingreso-pedido-especial';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';
import { PrintAgentService } from 'src/app/admin/services/print-agent.service';
import { IngresoEfectivoDialogComponent } from '../ingreso-efectivo-dialog/ingreso-efectivo-dialog.component';

/** Datos de apertura del diálogo: el cliente sobre el que se registra el abono. */
export interface RealizarAbonoDialogData {
  idCliente: number;
  nombreCliente: string;
}

/**
 * Diálogo "Realizar abono" (`cuentas_por_cobrar_pe`, FE-6/FE-7) — réplica del modal "Realizar
 * abono del cliente" de `ConsultarCuentasPorCobrar.cshtml` + `EvtConsultaCuentasPorCobrar.js`.
 *
 * 1) Guard de caja abierta (réplica exacta de `NuevoPedidoComponent.validarCajaAbierta`): si no
 *    hay caja, fuerza `IngresoEfectivoDialogComponent` (apertura) y, si se cancela, cierra este
 *    diálogo también (no se puede operar sin caja).
 * 2) Detalle de pedidos con adeudo del cliente (`obtenerDetalleCuentaPorCobrar`), con checkbox de
 *    selección ÚNICA (réplica de `soloUno()`): si se marca uno, "Total adeudo" muestra su saldo;
 *    si no, la suma de todos los pedidos con adeudo del cliente.
 * 3) Formulario de abono: Forma de Pago, Cantidad a abonar, Comisión bancaria (computed, solo
 *    tarjeta crédito/débito, % de `Sesion.comisionBancaria`), Total, Efectivo/Cambio (solo si la
 *    forma de pago es Efectivo). Validaciones cliente réplica de
 *    `EvtConsultaCuentasPorCobrar.js:498-518`; el SP es la autoridad final.
 * 4) Al guardar con éxito: imprime el ticket del abono (`obtenerTicketAbono` + `imprimirPdfBlob`,
 *    mismo patrón que P-05/P-06) y cierra el diálogo con `OK` para que el listado padre refresque.
 */
@Component({
  selector: 'app-realizar-abono-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TranslatePipe, CurrencyPipe, BlockUIModule],
  templateUrl: './realizar-abono-dialog.component.html',
})
export class RealizarAbonoDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PedidosEspecialesService);
  private readonly printAgent = inject(PrintAgentService);
  private readonly sesionService = inject(SesionService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<RealizarAbonoDialogComponent>);
  readonly data = inject<RealizarAbonoDialogData>(MAT_DIALOG_DATA);

  @BlockUI('realizarAbono') blockUI!: NgBlockUI;

  readonly cargando = signal(false);
  readonly guardando = signal(false);

  readonly detalle = signal<DetalleCuentaPorCobrar[]>([]);
  readonly formasPago = signal<FormaPago[]>([]);

  /** Pedido específico marcado en el detalle (checkbox único, réplica de `soloUno`). `null` = aplica al total. */
  readonly idPedidoSeleccionado = signal<number | null>(null);

  readonly displayedColumns = ['seleccionar', 'idPedidoEspecial', 'fechaUltimoAbono', 'saldoInicial', 'saldoActual', 'facturado'];

  readonly abonoForm = this.fb.group({
    idFactFormaPago: [null as number | null, Validators.required],
    montoAbono: [null as number | null, [Validators.required, Validators.min(0.01)]],
    montoRecibido: [null as number | null],
  });

  private readonly idFactFormaPagoValue = toSignal(this.abonoForm.controls.idFactFormaPago.valueChanges, {
    initialValue: this.abonoForm.controls.idFactFormaPago.value,
  });
  private readonly montoAbonoValue = toSignal(this.abonoForm.controls.montoAbono.valueChanges, {
    initialValue: this.abonoForm.controls.montoAbono.value,
  });
  private readonly montoRecibidoValue = toSignal(this.abonoForm.controls.montoRecibido.valueChanges, {
    initialValue: this.abonoForm.controls.montoRecibido.value,
  });

  private readonly formaPagoSeleccionada = computed(() =>
    this.formasPago().find((f) => f.id === this.idFactFormaPagoValue()),
  );

  readonly esTarjeta = computed(() => esFormaPagoTarjeta(this.formaPagoSeleccionada()));
  readonly esEfectivo = computed(() => esFormaPagoEfectivo(this.formaPagoSeleccionada()));

  /** Réplica de `actualizarTotalAdeudo`: saldo del pedido marcado, o la suma de todos si no hay selección. */
  readonly totalAdeudo = computed(() => {
    const seleccionado = this.idPedidoSeleccionado();
    const lista = this.detalle();
    if (seleccionado != null) {
      return lista.find((d) => d.idPedidoEspecial === seleccionado)?.saldoActual ?? 0;
    }
    return this.round2(lista.reduce((acc, d) => acc + d.saldoActual, 0));
  });

  /** % de comisión bancaria de la sesión (`Sesion.comisionBancaria`), mismo campo que `cobro-dialog` (Ventas). */
  private readonly comisionBancariaPorcentaje = computed(
    () => this.sesionService.sesion()?.comisionBancaria ?? 0,
  );

  /** Comisión bancaria: solo tarjeta (crédito id 4 / débito id 18, HU regla 7). Cualquier otra forma → 0. */
  readonly comisionBancaria = computed(() => {
    if (!this.esTarjeta()) return 0;
    const monto = Number(this.montoAbonoValue() ?? 0);
    return this.round2(monto * (this.comisionBancariaPorcentaje() / 100));
  });

  /** Total = cantidad a abonar + comisión (HU regla 7; IVA siempre 0, sin facturación en esta pantalla). */
  readonly total = computed(() => this.round2(Number(this.montoAbonoValue() ?? 0) + this.comisionBancaria()));

  /** Cambio = efectivo recibido − total (solo si forma de pago = Efectivo, HU regla 8). */
  readonly cambio = computed(() => {
    if (!this.esEfectivo()) return 0;
    const recibido = Number(this.montoRecibidoValue() ?? 0);
    const total = this.total();
    return recibido > total ? this.round2(recibido - total) : 0;
  });

  ngOnInit(): void {
    this.blockUI.start(this.translate.instant('pedidosEspeciales.realizarAbonoDialog.msg.cargando'));
    this.validarCajaAbierta();
    this.cargarDetalle();
    this.cargarFormasPago();
  }

  // ====================== Guard de caja abierta (réplica de NuevoPedidoComponent) ======================

  private validarCajaAbierta(): void {
    this.service
      .refrescarCajaAbierta()
      .subscribe({
        next: (abierta) => {
          if (!abierta) this.abrirAperturaCaja();
        },
        error: (err) => {
          console.error('Error al validar la caja abierta de Pedidos Especiales', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.realizarAbonoDialog.msg.errorValidarCaja'));
        },
      });
  }

  private abrirAperturaCaja(): void {
    this.dialog
      .open(IngresoEfectivoDialogComponent, {
        width: '480px',
        maxWidth: '95vw',
        disableClose: true,
        data: { tipo: TipoIngresoPedidoEspecialId.AperturaCaja },
      })
      .afterClosed()
      .subscribe((res: ResultModalModel | undefined) => {
        if (res?.status === ENUM_ESTATUS_MODAL.OK) return;
        this.notify.notify('warning', this.translate.instant('pedidosEspeciales.realizarAbonoDialog.msg.aperturaRequerida'));
        this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
      });
  }

  // ====================== Carga de catálogos / detalle ======================

  private cargarDetalle(): void {
    this.cargando.set(true);
    this.service
      .obtenerDetalleCuentaPorCobrar(this.data.idCliente)
      .pipe(
        finalize(() => {
          this.cargando.set(false);
          this.blockUI.stop();
        }),
      )
      .subscribe({
        next: (lista) => this.detalle.set(lista),
        error: (err) => {
          console.error('Error al cargar el detalle de la cuenta por cobrar', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.realizarAbonoDialog.msg.loadError'));
        },
      });
  }

  private cargarFormasPago(): void {
    this.service.obtenerFormasPago().subscribe({
      next: (lista) => this.formasPago.set(lista),
      error: (err) => {
        console.error('Error al cargar las formas de pago', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.realizarAbonoDialog.msg.errorFormasPago'));
      },
    });
  }

  // ====================== Selección de pedido (checkbox único) ======================

  /** Réplica de `soloUno()`: marcar un pedido desmarca cualquier otro; volver a marcar el mismo lo desmarca. */
  toggleSeleccion(fila: DetalleCuentaPorCobrar): void {
    this.idPedidoSeleccionado.update((actual) => (actual === fila.idPedidoEspecial ? null : fila.idPedidoEspecial));
  }

  // ====================== Guardar ======================

  /** Botón "Abonar" — validaciones réplica de `EvtConsultaCuentasPorCobrar.js:498-518`; el SP es la autoridad final. */
  guardar(): void {
    if (this.guardando()) return;

    if (this.abonoForm.controls.idFactFormaPago.invalid) {
      this.abonoForm.markAllAsTouched();
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.realizarAbonoDialog.msg.formaPagoRequerida'));
      return;
    }

    const raw = this.abonoForm.getRawValue();
    const montoAbono = Number(raw.montoAbono);

    if (!montoAbono || montoAbono <= 0) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.realizarAbonoDialog.msg.montoMayorCero'));
      return;
    }

    if (montoAbono > this.totalAdeudo()) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.realizarAbonoDialog.msg.montoExcedeAdeudo'));
      return;
    }

    const totalFinal = this.total();

    if (this.esEfectivo()) {
      const recibido = Number(raw.montoRecibido ?? 0);
      if (!raw.montoRecibido || recibido < totalFinal) {
        this.notify.notify('warning', this.translate.instant('pedidosEspeciales.realizarAbonoDialog.msg.efectivoInsuficiente'));
        return;
      }
    }

    if (!this.service.cajaAbierta()) {
      this.abrirAperturaCaja();
      return;
    }

    const request = new RealizarAbonoRequestModel({
      idCliente: this.data.idCliente,
      montoAbono,
      montoComision: this.comisionBancaria(),
      // Solo aplica en Efectivo. Para las demas formas de pago va 0, igual que el legado
      // (EvtConsultaCuentasPorCobrar.js::btnAbonar) y que el contrato de RealizarAbonoRequest.
      montoRecibido: this.esEfectivo() ? Number(raw.montoRecibido ?? 0) : 0,
      idFactFormaPago: Number(raw.idFactFormaPago),
      idPedidoEspecial: this.idPedidoSeleccionado(),
    });

    this.guardando.set(true);
    this.blockUI.start(this.translate.instant('pedidosEspeciales.realizarAbonoDialog.msg.guardando'));
    this.service
      .realizarAbono(request)
      .pipe(
        finalize(() => {
          this.guardando.set(false);
          this.blockUI.stop();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200 && res.modelo) {
            this.notify.notify('success', res.mensaje || this.translate.instant('pedidosEspeciales.realizarAbonoDialog.msg.guardadoOk'));
            this.imprimirTicket(res.modelo.idAbonoCliente);
            this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK }));
          } else {
            this.notify.notify('error', res?.mensaje ?? this.translate.instant('pedidosEspeciales.realizarAbonoDialog.msg.saveFallback'));
          }
        },
        error: (err) => {
          console.error('Error al registrar el abono de la cuenta por cobrar', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.realizarAbonoDialog.msg.saveError'));
        },
      });
  }

  /** Ticket térmico (80mm) del abono recién registrado — se IMPRIME vía el print-agent (nunca `abrirPdfBlob`). */
  private imprimirTicket(idAbonoCliente: number): void {
    this.service.obtenerTicketAbono(idAbonoCliente).subscribe({
      next: (blob) => imprimirPdfBlob(blob, this.printAgent),
      error: (err) => {
        console.error('Error al generar el ticket PDF del abono', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.realizarAbonoDialog.msg.ticketError'));
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }

  private round2(n: number): number {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }
}
