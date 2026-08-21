import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, map } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { FormaPago } from 'src/app/admin/models/ventas/forma-pago';
import { UsoCfdi } from 'src/app/admin/models/ventas/uso-cfdi';
import { GuardarIvaPedidoEspecialRequestModel } from 'src/app/admin/models/pedidos-especiales/guardar-iva-pedido-especial-request';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { ClientesService } from 'src/app/admin/services/clientes.service';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';

/** Id del cliente "Público en general" del legado (`$('#idClienteFact').val("1")` no se permite facturar). */
const ID_CLIENTE_PUBLICO_GENERAL = 1;

export interface FacturarPedidoEspecialDialogData {
  folio: number;
  /** `montoTotal` ya cargado en la fila del listado — mismo dato que el legado obtiene de `ConsultaDatosTicketPedidoEspecialV2`, sin llamada extra. */
  montoTotal: number;
}

/**
 * Diálogo "Facturar Pedido" (P-02) — réplica de `#ModalFacturar` +
 * `EvtConsultaPedidosEspecialesV2.js:671-931` (`modalFacturar`/`btnGuardarIVA`/`GuardarIVAPedido`).
 *
 * **Réplica literal de la semántica del legado, aunque parezca contraintuitiva:** el pedido ya
 * fue pagado en su totalidad SIN factura (`montoTotal`, mostrado como "Subtotal" tachado). Este
 * modal solo cobra el ajuste fiscal retroactivo: el campo "Total" (`previoFinal` en el legado) es
 * el **IVA faltante** (`montoTotal * 0.16`), NO `subtotal + iva`. Efectivo/Cambio se calculan
 * contra ese mismo monto. No se "corrige" hacia `subtotal + iva`: sería una mejora sobre el
 * legado, fuera de alcance (ver `21-paridad-visual-legado.md`).
 */
@Component({
  selector: 'app-facturar-pedido-especial-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TranslatePipe, CurrencyPipe, SelectPaginadoComponent],
  templateUrl: './facturar-pedido-especial-dialog.component.html',
})
export class FacturarPedidoEspecialDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clientesService = inject(ClientesService);
  private readonly pedidosEspecialesService = inject(PedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<FacturarPedidoEspecialDialogComponent>);
  readonly data = inject<FacturarPedidoEspecialDialogData>(MAT_DIALOG_DATA);

  readonly formasPago = signal<FormaPago[]>([]);
  readonly usoCfdiOpciones = signal<UsoCfdi[]>([]);
  readonly enviando = signal(false);

  /** Defaults del legado: `formaPago` = 1, `usoCFDI` = 3 (`limpiaModalIVA`). */
  readonly facturarForm = this.fb.group({
    idCliente: [null as number | null, Validators.required],
    idFormaPago: [1 as number | null, Validators.required],
    idUsoCFDI: [3 as number | null, Validators.required],
    efectivo: [null as number | null],
  });

  private readonly efectivoValue = toSignal(this.facturarForm.controls.efectivo.valueChanges, {
    initialValue: this.facturarForm.controls.efectivo.value,
  });

  readonly subtotal = this.data.montoTotal;
  /** `montoIVA` del legado — el "Total" a cobrar ahora (ver nota de clase). */
  readonly iva = this.round2(this.data.montoTotal * 0.16);
  readonly total = this.iva;

  readonly cambio = computed(() => {
    const efectivo = Number(this.efectivoValue() ?? 0);
    return efectivo > this.total ? this.round2(efectivo - this.total) : 0;
  });

  /** fetchPage del selector paginado de cliente (regla 16), mismo catálogo que "Nuevo Pedido". */
  readonly fetchClientes = (q: string, page: number) =>
    this.clientesService.listar({ q, page, perPage: 25 }).pipe(map((res) => res.data));

  constructor() {
    this.pedidosEspecialesService.obtenerFormasPago().subscribe({
      next: (lista) => this.formasPago.set(lista),
      error: (err) => {
        console.error('Error al cargar las formas de pago', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.facturarPedidoDialog.msg.errorFormasPago'));
      },
    });
    this.pedidosEspecialesService.obtenerUsosCfdi().subscribe({
      next: (lista) => this.usoCfdiOpciones.set(lista),
      error: (err) => {
        console.error('Error al cargar los usos de CFDI', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.facturarPedidoDialog.msg.errorUsoCfdi'));
      },
    });
  }

  /** Botón "Guardar" (réplica de `$('#btnGuardarIVA').click`). Doble-submit bloqueado. */
  aceptar(): void {
    if (this.enviando()) return;

    const raw = this.facturarForm.getRawValue();

    if (!raw.idCliente) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.facturarPedidoDialog.msg.clienteRequerido'));
      return;
    }
    if (raw.idCliente === ID_CLIENTE_PUBLICO_GENERAL) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.facturarPedidoDialog.msg.clientePublicoGeneral'));
      return;
    }
    if (!raw.efectivo) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.facturarPedidoDialog.msg.efectivoRequerido'));
      return;
    }
    if (Number(raw.efectivo) < this.total) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.facturarPedidoDialog.msg.efectivoInsuficiente', { total: this.total }),
      );
      return;
    }

    this.enviando.set(true);

    const request = new GuardarIvaPedidoEspecialRequestModel({
      idCliente: Number(raw.idCliente),
      idFactFormaPago: Number(raw.idFormaPago),
      idFactUsoCfdi: Number(raw.idUsoCFDI),
    });

    this.pedidosEspecialesService
      .guardarIva(this.data.folio, request)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify('success', res.mensaje || this.translate.instant('pedidosEspeciales.facturarPedidoDialog.msg.guardadoOk'));
            this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK }));
          } else {
            this.notify.notify('error', res?.mensaje ?? this.translate.instant('pedidosEspeciales.facturarPedidoDialog.msg.saveFallback'));
          }
        },
        error: (err) => {
          console.error('Error al guardar el IVA del pedido especial', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.facturarPedidoDialog.msg.saveError'));
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
