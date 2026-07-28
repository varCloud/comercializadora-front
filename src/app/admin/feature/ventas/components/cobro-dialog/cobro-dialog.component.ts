import { CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable, map } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { Cliente } from 'src/app/admin/models/clientes/cliente';
import { ClientesService } from 'src/app/admin/services/clientes.service';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { validarEmail, validarRfc } from 'src/app/admin/shared/utils/validadores-fiscales';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { FormaPago } from 'src/app/admin/models/ventas/forma-pago';
import { DatosCobroModel } from 'src/app/admin/models/ventas/datos-cobro';
import { PosCatalogoMockService } from '../../services/pos-catalogo-mock.service';

/** Datos que recibe el modal al abrirse: el subtotal del ticket (ya con descuento por volumen). */
export interface CobroDialogData {
  subtotalTicket: number;
}

const CLIENTE_GENERICO_ID = 1;
/**
 * % de comisión bancaria simulado. En el legado viene de configuración (`#comisionBancaria`,
 * poblado desde `SP_CONSULTA_CONFIGURACION_VENTAS` — Bloque B, aún no migrado). TODO (FE-A5):
 * sustituir por el valor real de configuración cuando exista el endpoint.
 */
const COMISION_BANCARIA_PORCENTAJE = 3.5;

/**
 * Modal de cobro del POS (FE-A4). Réplica de `#ModalPrevioVenta` + `calculaTotales()` /
 * `$('#chkFacturar').click()` / `$('#efectivo').on('keyup')` de EvtVentas.js: selección de
 * cliente (con datos fiscales), forma de pago, checkbox "Facturar" con validaciones, comisión
 * bancaria (solo tarjeta + no factura), IVA (solo si factura), "clientes atendidos" obligatorio
 * si el cliente es de tipo RUTA, y cambio en tiempo real.
 *
 * No se cierra con click-fuera ni Escape (`disableClose: true` al abrirlo desde el POS — ver
 * `PosComponent.abrirCobro()`). El botón "Cobrar" bloquea doble-submit con `enviando()`.
 */
@Component({
  selector: 'app-cobro-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TranslatePipe,
    CurrencyPipe,
    SelectPaginadoComponent,
  ],
  templateUrl: './cobro-dialog.component.html',
})
export class CobroDialogComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly clientesService = inject(ClientesService);
  private readonly catalogoMock = inject(PosCatalogoMockService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<CobroDialogComponent>);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly data = inject<CobroDialogData>(MAT_DIALOG_DATA);

  readonly subtotalTicket = signal(0);
  readonly formasPago = signal<FormaPago[]>([]);
  readonly usoCfdiOpciones = signal<Catalogo[]>([]);
  readonly clientePreload = signal<unknown[]>([]);
  readonly clienteSeleccionado = signal<Cliente | null>(null);
  readonly enviando = signal(false);

  readonly cobroForm = this.fb.group({
    idCliente: [CLIENTE_GENERICO_ID as number | null, Validators.required],
    idFormaPago: [1 as number | null, Validators.required], // Efectivo por defecto (legado: formaPago="1")
    facturar: [false],
    idUsoCFDI: [null as number | null],
    numClientesAtendidos: [null as number | null],
    efectivo: [null as number | null],
  });

  readonly facturarValue = toSignal(this.cobroForm.controls.facturar.valueChanges, {
    initialValue: this.cobroForm.controls.facturar.value,
  });
  private readonly idFormaPagoValue = toSignal(this.cobroForm.controls.idFormaPago.valueChanges, {
    initialValue: this.cobroForm.controls.idFormaPago.value,
  });
  private readonly efectivoValue = toSignal(this.cobroForm.controls.efectivo.valueChanges, {
    initialValue: this.cobroForm.controls.efectivo.value,
  });

  readonly fetchClientes = (q: string, page: number): Observable<unknown[]> =>
    this.clientesService.listar({ q, page, perPage: 25 }).pipe(map((res) => res.data));

  private readonly formaPagoSeleccionada = computed(() =>
    this.formasPago().find((f) => f.id === this.idFormaPagoValue()),
  );

  readonly esEfectivo = computed(() => this.formaPagoSeleccionada()?.esEfectivo ?? true);

  /** Regla de negocio preservada del legado: se evalúa por texto, no por un flag booleano. */
  readonly esRuta = computed(() =>
    (this.clienteSeleccionado()?.nombreCompleto ?? '').toUpperCase().includes('RUTA'),
  );

  readonly descuentoCliente = computed(() => {
    const cliente = this.clienteSeleccionado();
    if (!cliente || cliente.idCliente === CLIENTE_GENERICO_ID || !cliente.descuento) return 0;
    return this.round2(this.subtotalTicket() * (cliente.descuento / 100));
  });

  readonly subtotalConDescuentoCliente = computed(() =>
    this.round2(this.subtotalTicket() - this.descuentoCliente()),
  );

  /** Comisión bancaria: solo tarjeta (crédito/débito) Y venta NO facturada. */
  readonly comisionBancaria = computed(() => {
    const forma = this.formaPagoSeleccionada();
    if (!forma?.esTarjeta || this.facturarValue()) return 0;
    return this.round2(this.subtotalConDescuentoCliente() * (COMISION_BANCARIA_PORCENTAJE / 100));
  });

  readonly subtotalConComision = computed(() =>
    this.round2(this.subtotalConDescuentoCliente() + this.comisionBancaria()),
  );

  /** IVA 16%, solo si se factura. */
  readonly iva = computed(() =>
    this.facturarValue() ? this.round2(this.subtotalConComision() * 0.16) : 0,
  );

  readonly total = computed(() => this.round2(this.subtotalConComision() + this.iva()));

  /** Cambio = efectivo pagado − total − comisión bancaria (la comisión ya está dentro de `total`). */
  readonly cambio = computed(() => {
    const efectivo = Number(this.efectivoValue() ?? 0);
    const total = this.total();
    return efectivo > total ? this.round2(efectivo - total) : 0;
  });

  constructor() {
    this.subtotalTicket.set(this.data?.subtotalTicket ?? 0);

    this.catalogoMock.obtenerFormasPago().subscribe((lista) => this.formasPago.set(lista));
    this.catalogoMock.obtenerUsoCfdi().subscribe((lista) => this.usoCfdiOpciones.set(lista));

    // Cliente genérico preseleccionado (paridad con `$('#idCliente').val("1")` del legado).
    this.clientesService.obtenerPorId(CLIENTE_GENERICO_ID).subscribe((cliente) => {
      if (cliente) {
        this.clienteSeleccionado.set(cliente);
        this.clientePreload.set([cliente]);
      }
    });
  }

  ngAfterViewInit(): void {
    this.focusEl('efectivo');
  }

  onClienteSeleccionado(item: unknown): void {
    const cliente = (item as Cliente | null) ?? null;
    this.clienteSeleccionado.set(cliente);
    if (!cliente || cliente.idCliente === CLIENTE_GENERICO_ID) {
      this.cobroForm.controls.numClientesAtendidos.setValue(null);
    }
    // Réplica de `calculaTotales('true')` en el listener `#idCliente.change` del legado
    // (EvtVentas.js:1504): cada cambio de cliente desmarca "Facturar" y su Uso de CFDI, para
    // forzar re-validar (email/RFC/no-genérico) contra el cliente recién seleccionado. Sin
    // `emitEvent: false` para que `facturarValue()` (y los computed que dependen de él:
    // comisión bancaria/IVA/total) se actualicen de inmediato.
    this.cobroForm.controls.facturar.setValue(false);
    this.cobroForm.controls.idUsoCFDI.setValue(null);
  }

  /** Réplica de `$('#chkFacturar').click()`: valida antes de dejar marcar el checkbox. */
  onFacturarChange(event: MatCheckboxChange): void {
    if (!event.checked) {
      this.cobroForm.controls.idUsoCFDI.setValue(null);
      return;
    }

    const cliente = this.clienteSeleccionado();
    if (!cliente || cliente.idCliente === CLIENTE_GENERICO_ID) {
      this.notify.notify('warning', this.translate.instant('ventas.cobro.msg.clienteGenericoNoFactura'));
      this.revertirFacturar(event);
      return;
    }
    if (!validarEmail(cliente.correo)) {
      this.notify.notify('warning', this.translate.instant('ventas.cobro.msg.correoInvalido'));
      this.revertirFacturar(event);
      return;
    }
    if (!validarRfc(cliente.rfc)) {
      this.notify.notify('warning', this.translate.instant('ventas.cobro.msg.rfcInvalido'));
      this.revertirFacturar(event);
      return;
    }
  }

  private revertirFacturar(event: MatCheckboxChange): void {
    event.source.checked = false;
    this.cobroForm.controls.facturar.setValue(false, { emitEvent: false });
  }

  /** Botón "Cobrar": valida, arma `DatosCobro` y cierra el modal. Doble-submit bloqueado. */
  cobrar(): void {
    if (this.enviando()) return;

    const raw = this.cobroForm.getRawValue();

    if (!raw.idCliente) {
      this.notify.notify('warning', this.translate.instant('ventas.cobro.msg.clienteRequerido'));
      return;
    }
    if (!raw.idFormaPago) {
      this.notify.notify('warning', this.translate.instant('ventas.cobro.msg.formaPagoRequerida'));
      return;
    }
    if (raw.facturar && !raw.idUsoCFDI) {
      this.notify.notify('warning', this.translate.instant('ventas.cobro.msg.usoCfdiRequerido'));
      return;
    }
    if (this.esRuta() && !raw.numClientesAtendidos) {
      this.notify.notify('warning', this.translate.instant('ventas.cobro.msg.clientesAtendidosRequerido'));
      return;
    }

    const totalFinal = this.total();
    const efectivoRecibido = this.esEfectivo() ? Number(raw.efectivo ?? 0) : totalFinal;

    if (this.esEfectivo() && !raw.efectivo) {
      this.notify.notify('warning', this.translate.instant('ventas.cobro.msg.efectivoRequerido'));
      return;
    }
    if (efectivoRecibido < totalFinal) {
      this.notify.notify(
        'warning',
        this.translate.instant('ventas.cobro.msg.efectivoInsuficiente', { total: totalFinal }),
      );
      return;
    }

    this.enviando.set(true);

    const datos = new DatosCobroModel({
      idCliente: Number(raw.idCliente),
      clienteNombre: this.clienteSeleccionado()?.nombreCompleto ?? '',
      idFormaPago: Number(raw.idFormaPago),
      formaPagoDescripcion: this.formaPagoSeleccionada()?.descripcion ?? '',
      facturar: !!raw.facturar,
      idUsoCFDI: raw.facturar ? raw.idUsoCFDI : null,
      numClientesAtendidos: raw.numClientesAtendidos,
      subtotalTicket: this.subtotalTicket(),
      descuentoCliente: this.descuentoCliente(),
      comisionBancaria: this.comisionBancaria(),
      iva: this.iva(),
      total: totalFinal,
      efectivoRecibido,
      cambio: this.cambio(),
    });

    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, data: datos }));
  }

  cerrar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }

  private focusEl(id: string): void {
    const el = this.host.nativeElement.querySelector(`#${id}`) as HTMLElement | null;
    el?.focus();
  }

  private round2(n: number): number {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }
}
