import { CurrencyPipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { debounceTime, distinctUntilChanged, finalize, map, of, switchMap } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { abrirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';
import { CONSTANTS } from 'src/app/config/constants';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Producto } from 'src/app/admin/models/productos/producto';
import {
  PartidaPedidoEspecial,
  PartidaPedidoEspecialModel,
} from 'src/app/admin/models/pedidos-especiales/partida-pedido-especial';
import { GuardarPedidoEspecialRequestModel } from 'src/app/admin/models/pedidos-especiales/guardar-pedido-especial-request';
import { PedidoEspecialProductoRequestModel } from 'src/app/admin/models/pedidos-especiales/pedido-especial-producto-request';
import { ClientesService } from 'src/app/admin/services/clientes.service';
import { ProductosService } from 'src/app/admin/services/productos.service';
import { UbicacionesService } from 'src/app/admin/services/ubicaciones.service';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';

/**
 * Página "Nuevo Pedido" (Bloque A, corregida post-verificación paso 05) — réplica de
 * `Views/PedidosEspecialesV2/PedidosEspeciales.cshtml` + `EvtPedidosEspecialesV2.js` (alta de
 * pedido especial): selección de cliente, almacén para validar existencia, productos con
 * cantidad/precio/existencia en una tabla de partidas editable, forma de pago, checkbox
 * "Facturar" (igual que `#chkFacturar`) que despliega Uso de CFDI y calcula IVA
 * (`calculaTotales()`: 16% del subtotal solo si factura), y total.
 *
 * **Los 3 flujos de guardado del legado** (mismo formulario, misma función
 * `GuardarPedidoEspecial(tipoRevision, idEstatusPedidoEspecial)` — `EvtPedidosEspecialesV2.js:579-638`):
 * "Guardar" = Revisión por Ticket (`tipoRevision=1, idEstatusPedidoEspecial=1`,
 * `btnRevisionPorTicket`), "Revisión por Hand Held" (`tipoRevision=2, idEstatusPedidoEspecial=1`,
 * `btnRevisionPorHandHeld`) y "Guardar Cotización" (`tipoRevision=3, idEstatusPedidoEspecial=2`,
 * `btnCotizar`/`btnGeneraCotizacion`) — este último alimenta la pantalla "Cotizaciones" (Bloque
 * C). El legado valida los 3 igual (cliente + al menos un producto, `abrirModalGuardarPedidoEspecial`
 * en `EvtPedidosEspecialesV2.js:530-576`); Forma de Pago/Uso CFDI **no** se envían en el payload
 * de `GuardarPedidoEspecial` en ningún flujo (confirmado en el JS: el `dataToPost` solo lleva
 * `productos/tipoRevision/idCliente/idEstatusPedidoEspecial/idPedidoEspecial/idPedidoEspecialMayoreo_`)
 * — por eso `guardar()` usa la misma validación de formulario para los 3 botones.
 *
 * Integración real: guarda con `PedidosEspecialesService.guardarPedido` y descarga el ticket PDF
 * — **sin** llamar `guardarIva` (corrección post-verificación: en el legado
 * `SP_GUARDA_IVA_PEDIDO_ESPECIAL_V2` solo se dispara manualmente y después, desde "Consultar
 * Pedidos" — `btnGuardarIVA`, `EvtConsultaPedidosEspecialesV2.js:858-889` — nunca desde el alta;
 * `guardarIva` se conserva en `PedidosEspecialesService` por si se porta ese botón a futuro,
 * pero esta pantalla ya no lo invoca). El legado tampoco descarga un PDF de ticket automáticamente
 * en ninguno de los 3 flujos (dispara impresión física server-side — `imprimirTicketAlmacenes`/
 * `ImprimeTicketPedidoEspecial`, no portable a web, mismo criterio que Bloque B); la descarga del
 * PDF del ticket de alta (`obtenerTicket`, Bloque A) es la adaptación web ya establecida y
 * aprobada de esa impresión — se replica igual para los 3 flujos porque el legado no distingue
 * entre ellos en su handler de éxito.
 *
 * Cliente/almacenes/búsqueda de producto/precio por volumen reusan
 * `ClientesService`/`UbicacionesService`/`ProductosService` ya migrados (regla 00); solo lo
 * propio de Pedidos Especiales (guardar, existencia por almacén, formas de pago/uso CFDI
 * propios, ticket) pasa por `PedidosEspecialesService`.
 */
@Component({
  selector: 'app-nuevo-pedido',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    TablerIconsModule,
    TranslatePipe,
    BlockUIModule,
    CurrencyPipe,
    SelectPaginadoComponent,
  ],
  templateUrl: './nuevo-pedido.component.html',
  styleUrl: './nuevo-pedido.component.scss',
})
export class NuevoPedidoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly clientesService = inject(ClientesService);
  private readonly productosService = inject(ProductosService);
  private readonly ubicacionesService = inject(UbicacionesService);
  private readonly pedidosEspecialesService = inject(PedidosEspecialesService);

  @BlockUI('nuevo-pedido') blockUI!: NgBlockUI;

  @ViewChild('buscarProductoInput') private readonly buscarProductoInputRef!: ElementRef<HTMLInputElement>;

  readonly nuevoPedidoForm = this.fb.group({
    idCliente: [null as number | null, Validators.required],
    idAlmacen: [null as number | null, Validators.required],
    idFormaPago: [null as number | null, Validators.required],
    facturar: [false],
    idUsoCFDI: [null as number | null],
  });

  readonly facturarValue = toSignal(this.nuevoPedidoForm.controls.facturar.valueChanges, {
    initialValue: this.nuevoPedidoForm.controls.facturar.value,
  });

  // ====================== Catálogos ======================

  readonly almacenes = signal<Catalogo[]>([]);
  readonly formasPago = signal<Catalogo[]>([]);
  readonly usoCfdiOpciones = signal<Catalogo[]>([]);
  /** Sembrado del cliente seleccionado para `app-select-paginado` (regla 16). */
  readonly clientePreload = signal<unknown[]>([]);

  /**
   * Catálogo grande (>25, mismo precedente que `ventas-list`/`cobro-dialog`) → selector
   * paginado (regla 16), reusando `ClientesService.listar` ya migrado (regla 00).
   */
  readonly fetchClientes = (q: string, page: number) =>
    this.clientesService.listar({ q, page, perPage: 25 }).pipe(map((res) => res.data));

  // ====================== Buscador de producto (réplica del select2 legado) ======================

  readonly buscarProductoControl = new FormControl<Producto | string>('', { nonNullable: true });
  readonly productoSeleccionado = signal<Producto | null>(null);
  readonly buscandoProductos = signal(false);
  cantidadManual = 1;

  /**
   * Búsqueda server-side por descripción (`ProductosService.buscarPorDescripcion`, regla 00 —
   * mismo endpoint `GET /productos/buscar?descripcion=` que el resto del catálogo). Debounce +
   * `distinctUntilChanged` (regla 13) para no disparar una petición por tecla.
   */
  readonly sugerenciasProductos = toSignal(
    this.buscarProductoControl.valueChanges.pipe(
      map((valor) => (typeof valor === 'string' ? valor : '').trim()),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => {
        if (term.length < 2) return of([] as Producto[]);
        this.buscandoProductos.set(true);
        return this.productosService.buscarPorDescripcion(term).pipe(
          finalize(() => this.buscandoProductos.set(false)),
        );
      }),
    ),
    { initialValue: [] as Producto[] },
  );

  // ====================== Tabla de partidas ======================

  readonly partidas = signal<PartidaPedidoEspecialModel[]>([]);

  readonly subtotal = computed(() =>
    this.round2(this.partidas().reduce((acc, p) => acc + this.importePartida(p), 0)),
  );

  /** IVA 16% del subtotal, solo si "Facturar" está marcado — réplica exacta de `calculaTotales()`. */
  private readonly ivaCalculado = computed(() =>
    this.facturarValue() ? this.round2(this.subtotal() * 0.16) : 0,
  );

  /** Ajuste manual de IVA: solo afecta el total mostrado antes de guardar (ver nota en el DTO). */
  readonly ivaAjustado = signal<number | null>(null);
  readonly ajustandoIva = signal(false);

  readonly iva = computed(() => this.ivaAjustado() ?? this.ivaCalculado());

  readonly total = computed(() => this.round2(this.subtotal() + this.iva()));

  readonly guardando = signal(false);

  ngOnInit(): void {
    this.cargarCatalogosIniciales();
    this.nuevoPedidoForm.controls.idAlmacen.valueChanges.subscribe((idAlmacen) => {
      if (!idAlmacen) return;
      this.partidas().forEach((p) => this.actualizarExistencia(p.idProducto, idAlmacen));
    });
  }

  private cargarCatalogosIniciales(): void {
    // Almacenes de la sucursal fija (Uruapan, regla 15): el selector de sucursal no aplica aquí,
    // solo se usa el id fijo para pedir los almacenes (reusa UbicacionesService, regla 00).
    this.ubicacionesService.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID).subscribe({
      next: (lista) => this.almacenes.set(lista),
      error: (err) => {
        console.error('Error al cargar el catálogo de almacenes', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.loadError'));
      },
    });

    this.pedidosEspecialesService.obtenerFormasPago().subscribe({
      next: (lista) => this.formasPago.set(lista),
      error: (err) => {
        console.error('Error al cargar el catálogo de formas de pago', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.loadError'));
      },
    });

    this.pedidosEspecialesService.obtenerUsosCfdi().subscribe({
      next: (lista) => this.usoCfdiOpciones.set(lista),
      error: (err) => {
        console.error('Error al cargar el catálogo de usos de CFDI', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.loadError'));
      },
    });
  }

  /**
   * Existencia de un producto en el almacén indicado (o el seleccionado en el form). Actualiza
   * la partida con `existencia`/`inhabilitado` (ya calculados por la API, el front no los
   * re-evalúa — mismo criterio que `PedidoEspecialProducto` en Ventas Bloque E).
   */
  private actualizarExistencia(idProducto: number, idAlmacen?: number | null): void {
    const almacen = idAlmacen ?? this.nuevoPedidoForm.controls.idAlmacen.value;
    if (!almacen) return;

    this.pedidosEspecialesService.consultarExistencia(idProducto, almacen).subscribe({
      next: (res) => {
        const existencia = res?.modelo?.cantidad ?? 0;
        const inhabilitado = res?.modelo?.inhabilitado ?? true;
        this.partidas.update((lista) =>
          lista.map((p) =>
            p.idProducto === idProducto ? new PartidaPedidoEspecialModel({ ...p, existencia, inhabilitado }) : p,
          ),
        );
      },
      error: (err) => {
        console.error('Error al consultar la existencia del producto', err);
      },
    });
  }

  // ====================== Cliente ======================

  /**
   * Sin validación adicional de datos fiscales al seleccionar: a diferencia de `cobro-dialog`
   * (Ventas), esta HU no pide validar RFC/régimen del cliente antes de guardar — el pedido se
   * puede ajustar fiscalmente después con "Ajustar IVA" (ver `guardarIva`). Hook reservado por
   * si una HU futura de este bloque lo requiere.
   */
  onClienteSeleccionado(_item: unknown): void {}

  // ====================== Facturar / Uso CFDI ======================

  onFacturarChange(_event: MatCheckboxChange): void {
    if (!this.nuevoPedidoForm.controls.facturar.value) {
      this.nuevoPedidoForm.controls.idUsoCFDI.setValue(null);
    }
  }

  // ====================== Buscador de producto ======================

  onSugerenciaProductoSeleccionada(producto: Producto): void {
    this.productoSeleccionado.set(producto);
  }

  mostrarProducto(valor: Producto | string | null): string {
    if (!valor || typeof valor === 'string') return valor ?? '';
    return valor.descripcion;
  }

  agregarProducto(): void {
    const producto = this.productoSeleccionado();
    if (!producto) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.nuevoPedido.buscarProducto.msg.seleccionaProducto'),
      );
      return;
    }

    const cantidad = Number(this.cantidadManual);
    if (!cantidad || cantidad <= 0) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.nuevoPedido.buscarProducto.msg.cantidadRequerida'),
      );
      return;
    }

    const existente = this.partidas().find((p) => p.idProducto === producto.idProducto);
    if (existente) {
      this.partidas.update((lista) =>
        lista.map((p) =>
          p.idProducto === producto.idProducto
            ? new PartidaPedidoEspecialModel({ ...p, cantidad: this.round2(p.cantidad + cantidad) })
            : p,
        ),
      );
      this.recalcularPrecios();
      this.resetearBuscadorProducto();
      return;
    }

    // Precios + rangos de mayoreo del producto (GET /productos/{id}/precios, regla 00): se
    // piden al agregarlo, no en la búsqueda (evita llamadas por cada tecla del autocompletado).
    this.productosService.obtenerPrecios(producto.idProducto).subscribe({
      next: (precios) => {
        this.partidas.update((lista) => [
          ...lista,
          new PartidaPedidoEspecialModel({
            idProducto: producto.idProducto,
            descripcion: producto.descripcion,
            codigoBarras: producto.codigoBarras,
            cantidad,
            precioIndividual: precios.precioIndividual ?? producto.precioIndividual ?? 0,
            precioMenudeo: precios.precioMenudeo ?? producto.precioMenudeo ?? 0,
            precio: precios.precioIndividual ?? producto.precioIndividual ?? 0,
            existencia: -1,
            rangos: precios.rangos,
          }),
        ]);
        this.recalcularPrecios();
        this.actualizarExistencia(producto.idProducto);
      },
      error: (err) => {
        console.error('Error al consultar el precio del producto', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.preciosError'));
      },
    });

    this.resetearBuscadorProducto();
  }

  private resetearBuscadorProducto(): void {
    this.buscarProductoControl.setValue('');
    this.productoSeleccionado.set(null);
    this.cantidadManual = 1;
    this.focusBuscarProducto();
  }

  onCantidadPartidaBlur(partida: PartidaPedidoEspecial): void {
    let cantidad = Number(partida.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.nuevoPedido.buscarProducto.msg.cantidadRequerida'),
      );
      cantidad = 1;
    }
    this.partidas.update((lista) =>
      lista.map((p) => (p.idProducto === partida.idProducto ? new PartidaPedidoEspecialModel({ ...p, cantidad }) : p)),
    );
    this.recalcularPrecios();
  }

  eliminarPartida(idProducto: number): void {
    this.partidas.update((lista) => lista.filter((p) => p.idProducto !== idProducto));
    this.recalcularPrecios();
  }

  importePartida(partida: PartidaPedidoEspecial): number {
    return this.round2(partida.cantidad * partida.precio);
  }

  private focusBuscarProducto(): void {
    setTimeout(() => this.buscarProductoInputRef?.nativeElement?.focus());
  }

  /**
   * Recalcula el precio unitario de CADA partida — réplica exacta de `calculaTotales()`/
   * `actualizaTicketVenta()` del legado (ya migrada en `PosComponent.recalcularTicket`, Ventas):
   * cantidad TOTAL del pedido >= 6 → precioMenudeo, si no precioIndividual; si la cantidad de la
   * partida cae en uno de sus rangos propios, ese costo gana; si excede el `max` de todos sus
   * rangos, se usa el costo del rango de mayor `max`.
   */
  private recalcularPrecios(): void {
    const partidas = this.partidas();
    const cantidadTotal = partidas.reduce((acc, p) => acc + p.cantidad, 0);

    const actualizadas = partidas.map((p) => {
      let precio = cantidadTotal >= 6 ? p.precioMenudeo : p.precioIndividual;

      const rangoAplicable = p.rangos.find((r) => p.cantidad >= r.min && p.cantidad <= r.max);
      if (rangoAplicable) {
        precio = rangoAplicable.costo;
      } else if (p.rangos.length > 0 && p.cantidad > 6) {
        const rangoMax = p.rangos.reduce((max, r) => (r.max > max.max ? r : max));
        if (p.cantidad > rangoMax.max) {
          precio = rangoMax.costo;
        }
      }

      return new PartidaPedidoEspecialModel({ ...p, precio });
    });

    this.partidas.set(actualizadas);
  }

  // ====================== IVA (ajuste manual) ======================

  /** Muestra el input de ajuste manual, precargado con el IVA calculado (réplica de "Ajustar IVA"). */
  abrirAjusteIva(): void {
    this.ivaAjustado.set(this.iva());
    this.ajustandoIva.set(true);
  }

  cancelarAjusteIva(): void {
    this.ivaAjustado.set(null);
    this.ajustandoIva.set(false);
  }

  onIvaAjustadoChange(valor: number): void {
    this.ivaAjustado.set(this.round2(Number(valor) || 0));
  }

  // ====================== Guardar / limpiar ======================

  /**
   * Guarda el pedido (`POST /pedidos-especiales`) y, si se obtiene folio, descarga el ticket PDF
   * — **sin** ajuste automático de IVA (ver nota de cabecera del componente).
   *
   * `tipoRevision`/`idEstatusPedidoEspecial` generalizan los 3 botones del legado sobre el mismo
   * formulario (`GuardarPedidoEspecial(tipoRevision, idEstatusPedidoEspecial)`,
   * `EvtPedidosEspecialesV2.js:641`): **1,1** = Revisión por Ticket (`guardar()` sin argumentos,
   * botón "Guardar"), **2,1** = Revisión por Hand Held, **3,2** = Cotizar. La validación del
   * formulario es idéntica para los 3 (el legado no distingue: valida solo cliente + productos
   * antes de abrir el modal de guardado, ver cabecera del componente).
   */
  guardar(tipoRevision: number = 1, idEstatusPedidoEspecial: number = 1): void {
    if (this.guardando()) return;

    const raw = this.nuevoPedidoForm.getRawValue();

    if (!raw.idCliente) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.clienteRequerido'));
      return;
    }
    if (!raw.idAlmacen) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.almacenRequerido'));
      return;
    }
    if (!raw.idFormaPago) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.formaPagoRequerida'));
      return;
    }
    if (raw.facturar && !raw.idUsoCFDI) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.usoCfdiRequerido'));
      return;
    }
    if (this.partidas().length === 0) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.sinProductos'));
      return;
    }

    const idAlmacen = raw.idAlmacen;
    const request = new GuardarPedidoEspecialRequestModel({
      productos: this.partidas().map(
        (p) =>
          new PedidoEspecialProductoRequestModel({
            idProducto: p.idProducto,
            cantidad: p.cantidad,
            idAlmacen,
          }),
      ),
      tipoRevision,
      idCliente: raw.idCliente,
      idEstatusPedidoEspecial,
      idPedidoEspecial: 0,
      idPedidoEspecialMayoreo: 0,
    });

    this.guardando.set(true);
    this.blockUI.start(this.translate.instant('pedidosEspeciales.nuevoPedido.msg.guardando'));
    this.pedidosEspecialesService
      .guardarPedido(request)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200 && res.modelo) {
            this.notify.notify(
              'success',
              res.mensaje || this.translate.instant('pedidosEspeciales.nuevoPedido.msg.guardadoOk'),
            );
            const folio = res.modelo.idPedidoEspecial;
            this.limpiar();
            this.guardando.set(false);
            this.descargarTicket(folio);
          } else {
            this.guardando.set(false);
            this.notify.notify(
              'error',
              res?.mensaje ?? this.translate.instant('pedidosEspeciales.nuevoPedido.msg.saveFallback'),
            );
          }
        },
        error: (err) => {
          this.guardando.set(false);
          console.error('Error al guardar el pedido especial', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.saveError'));
        },
      });
  }

  /** Descarga el ticket PDF del pedido recién guardado (Bloque A, adaptación web de la impresión física del legado). */
  private descargarTicket(folio: number): void {
    this.pedidosEspecialesService.obtenerTicket(folio).subscribe({
      next: (blob) => abrirPdfBlob(blob),
      error: (err) => {
        console.error('Error al generar el ticket del pedido especial', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.ticketError'));
      },
    });
  }

  limpiar(): void {
    this.nuevoPedidoForm.reset({ idCliente: null, idAlmacen: null, idFormaPago: null, facturar: false, idUsoCFDI: null });
    this.partidas.set([]);
    this.ivaAjustado.set(null);
    this.ajustandoIva.set(false);
    this.buscarProductoControl.setValue('');
    this.productoSeleccionado.set(null);
    this.cantidadManual = 1;
    this.clientePreload.set([]);
  }

  private round2(n: number): number {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }
}
