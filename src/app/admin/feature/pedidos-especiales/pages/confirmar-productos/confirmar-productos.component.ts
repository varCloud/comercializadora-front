import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL } from 'src/app/models/result-modal';
import { Cliente } from 'src/app/admin/models/clientes/cliente';
import { ClientesService } from 'src/app/admin/services/clientes.service';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';
import { PrintAgentService } from 'src/app/admin/services/print-agent.service';
import { ProductoConfirmar, ProductoConfirmarModel } from 'src/app/admin/models/pedidos-especiales/producto-confirmar';
import { ConfirmacionProductoRequestModel } from 'src/app/admin/models/pedidos-especiales/confirmacion-producto-request';
import { GuardarConfirmacionRequestModel } from 'src/app/admin/models/pedidos-especiales/guardar-confirmacion-request';
import { TipoIngresoPedidoEspecialId } from 'src/app/admin/models/pedidos-especiales/tipo-ingreso-pedido-especial';
import { IngresoEfectivoDialogComponent } from '../../components/ingreso-efectivo-dialog/ingreso-efectivo-dialog.component';
import { RetiroExcesoEfectivoDialogComponent } from '../../components/retiro-exceso-efectivo-dialog/retiro-exceso-efectivo-dialog.component';
import {
  EntregarPedidoEspecialDialogComponent,
  EntregarPedidoEspecialDialogData,
  ResultadoEntregarPedidoEspecial,
} from '../../components/entregar-pedido-especial-dialog/entregar-pedido-especial-dialog.component';

/**
 * Página "Confirmar Productos" (Bloque B, FE-B5) — réplica de `Views/PedidosEspecialesV2/
 * ConfirmarProductos.cshtml` + `EvtConfirmarProductosV2.js`.
 *
 * **Decisión de arquitectura (página completa, NO diálogo):** el legado renderiza
 * "Confirmar Productos" como una **vista propia** (`ConfirmarProductos.cshtml`, con su propio
 * `<section>`/card, botones "Cancelar"/"Guardar" de página y su propia ruta
 * `PedidosEspecialesV2/ConfirmarProductos?idPedidoEspecial=&idCliente=`) — no un modal abierto
 * desde "Entregar Pedido". Por eso se migra como `pages/confirmar-productos/` (no
 * `components/confirmar-productos-dialog/`), navegada desde `EntregarPedidoComponent.entregar()`.
 * Lo que SÍ es un modal en el legado es la captura de "a quién se entrega + forma de pago"
 * (`#ModalEntregarPedidoEspecial`, disparado por el botón "Guardar" de esta página) — eso se
 * migra como el diálogo hijo `EntregarPedidoEspecialDialogComponent`.
 *
 * El folio + idCliente (querystring, igual que el legado) permiten cargar los datos reales del
 * cliente porque `ClientesService` ya está migrado (Bloque de Clientes, no este bloque).
 */
@Component({
  selector: 'app-confirmar-productos',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, BlockUIModule, TranslatePipe, FormsModule, CurrencyPipe],
  templateUrl: './confirmar-productos.component.html',
  styleUrl: './confirmar-productos.component.scss',
})
export class ConfirmarProductosComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly clientesService = inject(ClientesService);
  private readonly pedidosEspecialesService = inject(PedidosEspecialesService);
  private readonly printAgent = inject(PrintAgentService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('confirmar-productos') blockUI!: NgBlockUI;

  readonly folio = signal(0);
  readonly cliente = signal<Cliente | null>(null);
  readonly productos = signal<ProductoConfirmar[]>([]);
  /**
   * `true` cuando se llega a esta pantalla desde "Liquidar Pedido" de "Pedidos en Ruta"
   * (Bloque C, `PedidosEnRutaComponent.liquidar()`), vía query param `esPedidoEnRuta=true`
   * (réplica de `Url.Action("ConfirmarProductos", ..., new { idPedidoEspecial,
   * esPedidoEnRuta = true, idCliente })`). `false` (default) cuando se llega desde "Entregar
   * Pedido" (Bloque B). Se propaga tal cual al `GuardarConfirmacionRequest`.
   */
  readonly esPedidoEnRuta = signal(false);

  /** Subtotal = Σ (cantidadAceptada × precioVenta). Sin recálculo por rango de mayoreo todavía
   *  (ver TODO en `EntregarPedidoEspecialDialogComponent`: depende de `ObtenerPrecios_` real). */
  readonly subtotal = computed(() =>
    this.round2(this.productos().reduce((acc, p) => acc + p.cantidadAceptada * p.precioVenta, 0)),
  );

  ngOnInit(): void {
    const folio = Number(this.route.snapshot.paramMap.get('folio'));
    const idCliente = Number(this.route.snapshot.queryParamMap.get('idCliente'));
    this.folio.set(folio);
    this.esPedidoEnRuta.set(this.route.snapshot.queryParamMap.get('esPedidoEnRuta') === 'true');

    this.cargarProductos(folio);

    if (idCliente) {
      this.clientesService.obtenerPorId(idCliente).subscribe({
        next: (cliente) => this.cliente.set(cliente),
        error: (err) => console.error('Error al cargar el cliente del pedido especial', err),
      });
    }
  }

  // ====================== Toolbar de caja (P-03, 1:1 con `nuevo-pedido.component.ts`) ======================
  // Réplica de `ConfirmarProductos.cshtml:65-68` (mismo bloque de 4 botones que "Nuevo Pedido"):
  // el legado repite este toolbar en ambas pantallas hermanas. Mismos métodos/diálogos que
  // `NuevoPedidoComponent` (regla 00, no se duplica lógica) — sin el guard de "caja abierta" al
  // cargar (ese guard ya se ejecutó en "Nuevo Pedido"/"Entregar Pedido" antes de llegar aquí).

  /** "Ingreso de efectivo" — `AbrirModalIngresoEfectivo(2)`. */
  abrirIngresoEfectivo(): void {
    this.dialog.open(IngresoEfectivoDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: { tipo: TipoIngresoPedidoEspecialId.IngresoEfectivo },
    });
  }

  /** "Retiro de exceso de efectivo" — `AbrirModalRetiroExcesoEfectivo()`. */
  abrirRetiroExcesoEfectivo(): void {
    this.dialog.open(RetiroExcesoEfectivoDialogComponent, { width: '900px', maxWidth: '95vw' });
  }

  /** "Abrir cajón" — vía el agente local de impresión POS (`PrintAgentService`), mismo criterio que "Nuevo Pedido". */
  abrirCajon(): void {
    this.printAgent.abrirCajon().subscribe((abierto) => {
      const key = abierto
        ? 'pedidosEspeciales.nuevoPedido.acciones.abrirCajonExito'
        : 'pedidosEspeciales.nuevoPedido.acciones.abrirCajonNoDisponible';
      this.notify.notify(abierto ? 'success' : 'info', this.translate.instant(key));
    });
  }

  /** "Cierre de cajas" — el legado navega a `PedidosEspecialesV2/CierreCajas`. */
  irACierreCajas(): void {
    this.router.navigate(['/admin/pedidos-especiales/cierre-caja']);
  }

  /** `GET /pedidos-especiales/{folio}/productos-confirmar` (SP_CONSULTA_PEDIDOS_ESPECIALES_DETALLE_V2). */
  private cargarProductos(folio: number): void {
    this.blockUI.start(this.translate.instant('pedidosEspeciales.confirmarProductos.msg.cargando'));
    this.pedidosEspecialesService
      .obtenerProductosConfirmar(folio)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (lista) => this.productos.set(lista),
        error: (err) => {
          console.error('Error al cargar los productos del pedido especial', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.confirmarProductos.msg.loadError'));
        },
      });
  }

  /** Réplica de `EliminarProductos(id)`: pone en 0 la cantidad aceptada de la fila. */
  eliminarProducto(producto: ProductoConfirmar): void {
    this.productos.update((lista) =>
      lista.map((p) =>
        p.idPedidoEspecialDetalle === producto.idPedidoEspecialDetalle
          ? new ProductoConfirmarModel({ ...p, cantidadAceptada: 0 })
          : p,
      ),
    );
  }

  onCantidadAceptadaChange(producto: ProductoConfirmar, valor: number): void {
    let cantidad = Number(valor);
    if (isNaN(cantidad) || cantidad < 0) cantidad = 0;
    // Réplica de `validarProductosAceptados()`: no puede exceder la cantidad ATENDIDA por el
    // almacén (el legado usa esta regla en el mensaje de error, aunque el guard de tecleo
    // compara contra la cantidad SOLICITADA — inconsistencia del legado, se resuelve aquí a
    // favor de la regla documentada en el mensaje).
    if (cantidad > producto.cantidadAtendida) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.confirmarProductos.msg.cantidadExcedeAtendida'),
      );
      cantidad = producto.cantidadAtendida;
    }
    this.productos.update((lista) =>
      lista.map((p) =>
        p.idPedidoEspecialDetalle === producto.idPedidoEspecialDetalle
          ? new ProductoConfirmarModel({ ...p, cantidadAceptada: cantidad })
          : p,
      ),
    );
  }

  onObservacionesChange(producto: ProductoConfirmar, valor: string): void {
    this.productos.update((lista) =>
      lista.map((p) =>
        p.idPedidoEspecialDetalle === producto.idPedidoEspecialDetalle
          ? new ProductoConfirmarModel({ ...p, observacionesConfirmar: valor })
          : p,
      ),
    );
  }

  cancelar(): void {
    this.router.navigate(['/admin/pedidos-especiales/entregar-pedido']);
  }

  /**
   * Botón "Guardar" (réplica de `$('#btnGuardarPedidoEspecial').click`): valida
   * `validarProductosAceptados()` y, si pasa, abre el diálogo "Entregar Pedido Especial".
   */
  guardar(): void {
    if (!this.validarProductosAceptados()) return;

    const ref = this.dialog.open<EntregarPedidoEspecialDialogComponent, EntregarPedidoEspecialDialogData>(
      EntregarPedidoEspecialDialogComponent,
      {
        data: {
          folio: this.folio(),
          cliente: this.cliente(),
          subtotal: this.subtotal(),
        },
        width: '1000px',
        maxWidth: '95vw',
        disableClose: true,
      },
    );

    ref.afterClosed().subscribe((res) => {
      if (res?.status !== ENUM_ESTATUS_MODAL.OK || !res.data) return;
      this.guardarConfirmacion(res.data as ResultadoEntregarPedidoEspecial);
    });
  }

  /**
   * `POST /pedidos-especiales/{folio}/confirmacion` (réplica de `GuardarConfirmacion` +
   * `EvtConfirmarProductosV2.js`, evento `#btnEntregarPedidoEspecial`). Arma el body real con
   * las líneas de `productos()` + el resultado capturado en el diálogo.
   */
  private guardarConfirmacion(resultado: ResultadoEntregarPedidoEspecial): void {
    const request = new GuardarConfirmacionRequestModel({
      productos: this.productos().map(
        (p) =>
          new ConfirmacionProductoRequestModel({
            idProducto: p.idProducto,
            idPedidoEspecialDetalle: p.idPedidoEspecialDetalle,
            cantidadSolicitada: p.cantidadSolicitada,
            cantidadAtendida: p.cantidadAtendida,
            cantidadRechazada: p.cantidadRechazada,
            cantidadAceptada: p.cantidadAceptada,
            observaciones: p.observacionesConfirmar,
          }),
      ),
      idEstatusPedidoEspecial: this.resolverIdEstatusPedidoEspecial(resultado),
      numeroUnidadTaxi: resultado.entregadoATaxi ? resultado.numeroUnidadTaxi : '0',
      idEstatusCuentaPorCobrar: 0,
      montoPagado: resultado.tipoPago === 'credito' ? 0 : resultado.efectivoRecibido,
      aCredito: resultado.tipoPago === 'credito',
      aCreditoConAbono: resultado.tipoPago === 'creditoConAbono',
      aplicaIVA: resultado.facturar,
      idFactFormaPago: resultado.idFormaPago,
      idFactUsoCfdi: resultado.facturar ? (resultado.idUsoCFDI ?? 0) : 0,
      observacionesPedidoRuta: resultado.entregadoARuteo ? resultado.observacionesPedidoRuta : null,
      idUsuarioRuteo: resultado.entregadoARuteo ? (resultado.idUsuarioRuteo ?? 0) : 0,
      // `true` cuando se llega desde "Liquidar Pedido" de "Pedidos en Ruta" (Bloque C, query
      // param `esPedidoEnRuta`); `false` para la confirmación inicial de entrega (Bloque B).
      esPedidoEnRuta: this.esPedidoEnRuta(),
    });

    this.blockUI.start(this.translate.instant('pedidosEspeciales.confirmarProductos.msg.guardando'));
    this.pedidosEspecialesService
      .guardarConfirmacion(this.folio(), request)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify(
              'success',
              res.mensaje || this.translate.instant('pedidosEspeciales.confirmarProductos.msg.guardadoOk'),
            );
            this.router.navigate(['/admin/pedidos-especiales/entregar-pedido']);
          } else {
            this.notify.notify(
              'error',
              res?.mensaje ?? this.translate.instant('pedidosEspeciales.confirmarProductos.msg.saveFallback'),
            );
          }
        },
        error: (err) => {
          console.error('Error al guardar la confirmación de productos del pedido especial', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.confirmarProductos.msg.saveError'));
        },
      });
  }

  /**
   * Réplica exacta de la regla de `EvtConfirmarProductosV2.js` (evento
   * `#btnEntregarPedidoEspecial`) para calcular `idEstatusPedidoEspecial`:
   * - Liquidado: 6 (a Cliente) / 4 (a Ruteo o Taxi).
   * - A crédito (con o sin abono): 7 (a Cliente) / 5 (a Ruteo o Taxi).
   * - Si se entrega a Encargado de Ruteo, se sobrescribe con 9 ("Pedido en Ruta") sin importar
   *   el tipo de pago — el legado aplica este `if` después del cálculo anterior.
   */
  private resolverIdEstatusPedidoEspecial(resultado: ResultadoEntregarPedidoEspecial): number {
    let idEstatus = resultado.tipoPago === 'liquidado' ? (resultado.entregadoACliente ? 6 : 4) : resultado.entregadoACliente ? 7 : 5;

    if (resultado.entregadoARuteo) {
      idEstatus = 9;
    }

    return idEstatus;
  }

  /** Réplica de `validarProductosAceptados()` (EvtConfirmarProductosV2.js). */
  private validarProductosAceptados(): boolean {
    const productos = this.productos();
    let cantidadTotal = 0;

    for (const p of productos) {
      if (p.cantidadAceptada > p.cantidadAtendida) {
        this.notify.notify(
          'warning',
          this.translate.instant('pedidosEspeciales.confirmarProductos.msg.cantidadExcedeAtendida'),
        );
        return false;
      }
      if ((p.cantidadAceptada === 0 || p.cantidadAceptada !== p.cantidadAtendida) && !p.observacionesConfirmar) {
        this.notify.notify(
          'warning',
          this.translate.instant('pedidosEspeciales.confirmarProductos.msg.observacionesRequeridas'),
        );
        return false;
      }
      cantidadTotal += p.cantidadAceptada;
    }

    if (cantidadTotal <= 0) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.confirmarProductos.msg.sinProductosAceptados'));
      return false;
    }

    return true;
  }

  private round2(n: number): number {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }
}
