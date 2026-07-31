import { CurrencyPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { Notificacion } from 'src/app/models/sesion';
import { ProductoVenta, ProductoVentaModel } from 'src/app/admin/models/ventas/producto-venta';
import { LineaTicket, LineaTicketModel } from 'src/app/admin/models/ventas/linea-ticket';
import { LineaDevolucion, LineaDevolucionModel } from 'src/app/admin/models/ventas/linea-devolucion';
import { DatosCobro } from 'src/app/admin/models/ventas/datos-cobro';
import {
  GuardarVentaRequest,
  GuardarVentaRequestModel,
} from 'src/app/admin/models/ventas/guardar-venta-request';
import { VentaDetalleRequestModel } from 'src/app/admin/models/ventas/venta-detalle-request';
import { TipoVentaId } from 'src/app/admin/models/ventas/tipo-venta';
import { Venta } from 'src/app/admin/models/ventas/venta';
import { VentasService, TicketVentaTipo } from 'src/app/admin/services/ventas.service';
import { abrirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';
import { PosCatalogoService } from '../../services/pos-catalogo.service';
import {
  CobroDialogComponent,
  CobroDialogData,
} from '../../components/cobro-dialog/cobro-dialog.component';
import {
  ConsultarExistenciasDialogComponent,
  ConsultarExistenciasDialogData,
} from '../../components/consultar-existencias-dialog/consultar-existencias-dialog.component';
import {
  BuscarPedidoEspecialDialogComponent,
  BuscarPedidoEspecialResult,
} from '../../components/buscar-pedido-especial-dialog/buscar-pedido-especial-dialog.component';
import { IngresoEfectivoDialogComponent } from '../../components/ingreso-efectivo-dialog/ingreso-efectivo-dialog.component';
import { RetiroExcesoDialogComponent } from '../../components/retiro-exceso-dialog/retiro-exceso-dialog.component';
import { CierreDiaDialogComponent } from '../../components/cierre-dia-dialog/cierre-dia-dialog.component';

/**
 * Modo activo del ticket (FE-A5b). Réplica de las banderas `esDevolucion`/`esAgregarProductos`
 * (más "sin bandera" = venta normal) de `EvtVentas.js`, unificadas en un selector de modo en la
 * misma pantalla (decisión de UI del migrador, la HU lo describe como "modos de la misma
 * pantalla"). El modo "líquidos/despachadores" del legado NO es un modo de captura: es 100%
 * automático (columna `cantProductosLiq` de la respuesta de `GuardarVenta`, ver `enviarVenta()`).
 */
type ModoPos = 'venta' | 'devolucion' | 'complemento' | 'agregar-productos';

/**
 * Pantalla POS — venta (FE-A3/FE-A5a). Réplica de `Views/Ventas/Ventas.cshtml` + `EvtVentas.js`:
 * carga completa del catálogo de productos al entrar (`arrayProductos`), input de escaneo por
 * código de barras (Enter = búsqueda local + alta automática con cantidad 1), ticket editable
 * (alta/edición de cantidad, eliminar línea, recálculo en vivo del precio unitario) y descuento
 * por volumen evaluado por cantidad TOTAL del producto en el ticket (no por línea aislada).
 *
 * FE-A5a conectó esta pantalla a la API real: catálogo (`PosCatalogoService`, compone
 * `ProductosService` + `VentasService.obtenerExistencias()`, API-A6), guardado de venta y
 * catálogos de cobro (`VentasService`). Existencia real desde el inicio: bloquea alta/edición de
 * cantidad por encima de lo disponible y deshabilita productos sin stock en el buscador.
 *
 * FE-A5b agrega los 3 modos adicionales sobre el mismo ticket (selector `modo`, réplica de las
 * banderas `esDevolucion`/`esAgregarProductos` del legado):
 * - **Devolución**: localiza el ticket original por código de barras
 *   (`VentasService.buscarPorCodigoBarras` + `obtenerPorId`), el cajero marca cantidades a
 *   devolver por línea (tope = lo comprado), motivo obligatorio, prorrateo de comisión bancaria
 *   devuelta (réplica de `actualizarSubTotalDevoluciones()`) y guarda directo (sin modal de
 *   cobro — el legado tampoco cobra en una devolución).
 * - **Complemento**: localiza el ticket original igual que Devolución, pero el cajero sigue
 *   escaneando productos NUEVOS al ticket normal; el descuento por volumen (`recalcularTicket()`)
 *   suma las cantidades ya vendidas en el ticket localizado (réplica exacta de
 *   `actualizaTicketVenta()` cuando `idVentaComplemento > 0`: solo cuenta para el rango de
 *   precio, no se re-renderizan como líneas). Al guardar viaja `idVentaComplemento` con
 *   `tipoVenta = Normal` e `idVenta = 0` — así es como el legado arma el payload en este flujo
 *   (ver `AbrirModalComplementoVenta()`/`BuscarVentaCodigoBarras()`). Este modo se activa con el
 *   toggle manual "Complemento" de esta misma pantalla.
 * - **Agregar Productos** (submodo `'agregar-productos'`): comparte la MISMA UI de captura que
 *   Complemento (localiza el ticket por `idVenta`, permite escanear productos nuevos, el
 *   descuento por volumen suma las cantidades ya vendidas del ticket localizado), pero corresponde
 *   a un flujo LEGADO DISTINTO: `_ObtenerVentas.cshtml` → `EvtVentas.js:952-966`
 *   (`esAgregarProductos` / `TipoVentaId.AgregarProductosVenta`), que EDITA la venta original
 *   agregándole líneas nuevas. Al guardar viaja `tipoVenta = TipoVentaId.AgregarProductosVenta`,
 *   `idVenta = <venta localizada>` e `idVentaComplemento = 0`. Solo se alcanza vía el botón
 *   "Agregar Productos" del listado de ventas (`?idVenta=&modo=agregar-productos`); NO es
 *   seleccionable manualmente en el `mat-button-toggle-group`.
 * - **Líquidos/despachadores**: NO es un modo de captura (hallazgo de la investigación, ver
 *   memoria `modulo-ventas-modos-pos.md`). El legado solo usa `EnumTipoVenta.ProductosLiquidos`
 *   como filtro interno para imprimir un "Ticket para Despachadores" adicional cuando la venta
 *   normal contiene productos de líneas líquidas (`cantProductosLiq > 0` en la respuesta de
 *   `GuardarVenta`); la captura decimal ya la cubre el flag `fraccion` (FE-A3). Aquí se muestra
 *   un aviso informativo tras guardar cuando `cantProductosLiq > 0` (la generación del PDF en sí
 *   es Bloque D, fuera de esta tarea).
 */
@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    TablerIconsModule,
    TranslatePipe,
    BlockUIModule,
    CurrencyPipe,
  ],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
})
export class PosComponent implements OnInit, AfterViewInit {
  private readonly posCatalogo = inject(PosCatalogoService);
  private readonly ventasService = inject(VentasService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  @BlockUI('pos') blockUI!: NgBlockUI;

  @ViewChild('scanInput') private readonly scanInputRef!: ElementRef<HTMLInputElement>;

  readonly catalogo = signal<ProductoVenta[]>([]);
  readonly ticket = signal<LineaTicket[]>([]);
  /** Persiste en pantalla después de cerrar el modal de cobro ("Último Cambio" del legado). */
  readonly ultimoCambio = signal<number | null>(null);
  /**
   * Ticket de la última venta/complemento cobrado (FE-D1, Bloque D): persiste igual que
   * `ultimoCambio` para poder ver/reimprimir el PDF sin salir de la pantalla. `tieneLiquidos`
   * habilita el botón adicional del "Ticket para Despachadores" (ver comentario de clase).
   */
  readonly ultimoTicket = signal<{ idVenta: number; tieneLiquidos: boolean } | null>(null);
  readonly generandoTicket = signal(false);
  /** Bloquea doble-submit del guardado de venta (independiente del `enviando` del modal de cobro). */
  private readonly guardandoVenta = signal(false);

  /**
   * Folio del pedido especial localizado vía "Buscar Pedido Especial" (FE-E4, Bloque E). Viaja
   * en `GuardarVentaRequest.idPedidoEspecial` al guardar la venta (0 = sin pedido especial).
   * Se resetea junto con el resto del estado del ticket (`limpiarModo()`/`limpiarTicket()`).
   */
  readonly idPedidoEspecialActual = signal(0);

  /** idProducto cuyos rangos de precio por volumen ya se consultaron (carga LAZY, ver PosCatalogoService). */
  private readonly rangosResueltos = new Set<number>();

  /**
   * Un solo control para escanear (pistola lectora) O buscar por nombre/código sin pistola. El
   * valor es texto mientras se escribe/escanea; al SELECCIONAR una opción del autocomplete pasa
   * a ser el `ProductoVenta` completo (`mostrarProducto` lo pinta con su descripción). Cuando el
   * valor es un objeto, `agregarSeleccionado()` (botón "Agregar") usa `cantidadManual` en vez del
   * alta automática de cantidad 1 de la pistola lectora.
   */
  readonly scanControl = new FormControl<ProductoVenta | string>('', { nonNullable: true });
  private readonly scanTerm = toSignal(this.scanControl.valueChanges, {
    initialValue: '' as ProductoVenta | string,
  });
  readonly productoSeleccionado = signal<ProductoVenta | null>(null);
  /** Cantidad para el alta manual (sin pistola lectora), editable, default 1. */
  cantidadManual = 1;

  /** Sugerencias de autocompletado local (buscador por descripción/código, alcance de la HU). */
  readonly sugerencias = computed(() => {
    const valor = this.scanTerm();
    const term = (typeof valor === 'string' ? valor : '').trim().toUpperCase();
    if (!term) return [];
    return this.catalogo()
      .filter((p) => p.descripcion.toUpperCase().includes(term) || p.codigoBarras.includes(term))
      .slice(0, 15);
  });

  readonly cantidadTotalTicket = computed(() =>
    this.ticket().reduce((acc, l) => acc + l.cantidad, 0),
  );

  readonly subtotal = computed(() =>
    this.round2(this.ticket().reduce((acc, l) => acc + this.importeLinea(l), 0)),
  );

  // ====================== Modos (FE-A5b): venta / devolución / complemento ======================

  readonly modo = signal<ModoPos>('venta');
  /** Ticket original localizado por código de barras (modos Devolución/Complemento). */
  readonly ventaLocalizada = signal<Venta | null>(null);
  readonly buscandoTicket = signal(false);
  readonly buscarTicketControl = new FormControl('', { nonNullable: true });
  readonly motivoDevolucionControl = new FormControl('', { nonNullable: true });
  /** Líneas del ticket localizado con la cantidad que el cajero marca para devolver (modo Devolución). */
  readonly lineasDevolucion = signal<LineaDevolucion[]>([]);

  readonly totalADevolver = computed(() =>
    this.round2(
      this.lineasDevolucion().reduce(
        (acc, l) => acc + l.cantidadDevolver * l.detalle.precioVenta + this.comisionDevueltaLinea(l),
        0,
      ),
    ),
  );

  ngOnInit(): void {
    this.cargarCatalogo();
    this.cargarDesdeQueryParams();
  }

  /**
   * FE-6: si se llega desde el listado de ventas con
   * `?idVenta=&modo=devolucion|complemento|agregar-productos` (acciones "Devolver
   * Productos"/"Agregar Productos" de `VentaListadoComponent`), fija el modo y carga esa venta
   * automáticamente por el mismo camino que `buscarTicket()`, sin que el cajero tenga que
   * teclear el código de barras. Se lee el snapshot (no una suscripción reactiva) a propósito:
   * solo debe dispararse una vez al entrar, nunca de nuevo si el cajero cambia de modo
   * manualmente después (`cambiarModo()` ya limpia el estado en ese caso). `'agregar-productos'`
   * solo llega por este camino (query param); nunca se selecciona manualmente en el toggle.
   */
  private cargarDesdeQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    const modoParam = params.get('modo');
    const idVenta = Number(params.get('idVenta'));

    if (
      (modoParam !== 'devolucion' && modoParam !== 'complemento' && modoParam !== 'agregar-productos') ||
      !idVenta ||
      idVenta <= 0
    ) {
      return;
    }

    this.modo.set(modoParam);
    this.cargarVentaLocalizada(idVenta);
  }

  ngAfterViewInit(): void {
    this.focusScan();
  }

  private cargarCatalogo(): void {
    this.blockUI.start(this.translate.instant('ventas.pos.msg.cargandoCatalogo'));
    this.posCatalogo
      .obtenerCatalogoProductos()
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (productos) => {
          this.catalogo.set(productos);
          this.rangosResueltos.clear();
        },
        error: (err) => {
          console.error('Error al cargar el catálogo de productos', err);
          this.notify.notify('error', this.translate.instant('ventas.pos.msg.errorCatalogo'));
        },
      });
  }

  // ====================== Escaneo / búsqueda ======================

  /**
   * Selección desde el autocompletado: NO agrega de inmediato — deja el producto elegido en
   * `productoSeleccionado` (el input lo pinta con su descripción vía `mostrarProducto`) para que
   * el cajero confirme/ajuste `cantidadManual` y presione "Agregar". Necesario para el flujo SIN
   * pistola lectora (búsqueda manual por nombre), donde no siempre se quiere cantidad 1.
   */
  onSugerenciaSeleccionada(event: MatAutocompleteSelectedEvent): void {
    this.productoSeleccionado.set(event.option.value as ProductoVenta);
  }

  /** `displayWith` del autocomplete: qué se pinta en el input según se esté escribiendo o ya se haya seleccionado. */
  mostrarProducto(valor: ProductoVenta | string | null): string {
    if (!valor || typeof valor === 'string') return valor ?? '';
    return valor.descripcion;
  }

  /**
   * Enter sobre el campo único: si ya hay un producto SELECCIONADO del autocomplete (flujo sin
   * pistola), Enter equivale al botón "Agregar" con `cantidadManual`. Si el valor sigue siendo
   * texto (pistola lectora escaneando un código completo), sigue el flujo de alta automática
   * cantidad 1 de siempre.
   */
  onEnterProducto(): void {
    const valor = this.scanControl.value;
    if (valor && typeof valor === 'object') {
      this.agregarSeleccionado();
      return;
    }
    this.agregarPorCodigoBarras(valor);
  }

  /** Botón "Agregar" (o Enter con producto ya seleccionado): reusa `agregarConRangos()`. */
  agregarSeleccionado(): void {
    const producto = this.productoSeleccionado();
    if (!producto) {
      this.notify.notify(
        'warning',
        this.translate.instant('ventas.pos.buscarProducto.msg.seleccionaProducto'),
      );
      return;
    }

    this.agregarConRangos(producto, Number(this.cantidadManual));

    this.productoSeleccionado.set(null);
    this.cantidadManual = 1;
  }

  /** Enter sobre el campo de escaneo = flujo de pistola lectora (alta automática, cantidad 1). */
  agregarPorCodigoBarras(codigoRaw: string): void {
    // En modo Devolución no se escanean productos nuevos: el ticket lo arma la venta localizada.
    if (this.modo() === 'devolucion') return;

    const codigo = (codigoRaw ?? '').trim();
    if (!codigo) {
      this.focusScan();
      return;
    }

    const producto = this.catalogo().find(
      (p) => p.codigoBarras.toUpperCase() === codigo.toUpperCase(),
    );

    if (!producto) {
      this.notify.notify('error', this.translate.instant('ventas.pos.msg.productoNoExiste'));
      this.scanControl.setValue('');
      this.focusScan();
      return;
    }

    // Producto sin existencia: bloqueado (ni por escaneo ni por autocomplete), igual que el
    // legado marca la opción `disabled` en el select2 (EvtVentas.js `InitSelect2Productos()`).
    if (producto.existencia <= 0) {
      this.notify.notify('warning', this.translate.instant('ventas.pos.msg.sinExistencia'));
      this.scanControl.setValue('');
      this.focusScan();
      return;
    }

    this.agregarConRangos(producto, 1);
  }

  private focusScan(): void {
    setTimeout(() => this.scanInputRef?.nativeElement?.focus());
  }

  // ====================== Herramientas (FE-E1) ======================

  /**
   * Diálogo "Ingreso de Efectivo" (réplica de `AbrirModalIngresoEfectivo()`): igual que
   * "Consultar Existencias", el legado lo abre como modal DENTRO de la propia vista de ventas,
   * nunca navegando a otra pantalla.
   */
  abrirIngresoEfectivo(): void {
    this.dialog.open(IngresoEfectivoDialogComponent, { width: '500px', maxWidth: '95vw' });
  }

  /**
   * Diálogo "Cierre de Caja por Exceso de Efectivo" (réplica de
   * `AbrirModalCierreCajaExcedentes()`): mismo criterio que arriba, modal dentro del POS.
   */
  abrirRetiroExceso(): void {
    this.dialog.open(RetiroExcesoDialogComponent, { width: '900px', maxWidth: '95vw' });
  }

  /**
   * Diálogo "Cierre de Caja fin de Día" (réplica de `AbrirModalCierreDia()`): mismo criterio que
   * arriba, modal dentro del POS (antes navegaba a una pantalla aparte).
   */
  abrirCierreCaja(): void {
    this.dialog.open(CierreDiaDialogComponent, { width: '900px', maxWidth: '95vw', disableClose: true });
  }

  /** Placeholder puro (Supuesto #1 del Bloque E): sin hardware conectado, solo avisa. */
  abrirCajonDinero(): void {
    this.notify.notify('info', this.translate.instant('ventas.pos.herramientas.msg.cajonNoDisponible'));
  }

  /**
   * Diálogo "Consultar Existencias" (FE-E3): de solo lectura, no toca el ticket. Se le pasa el
   * catálogo YA cargado en memoria (`catalogo()`) para que el buscador interno del diálogo
   * filtre sobre el mismo arreglo, sin disparar una llamada HTTP nueva (regla 00).
   */
  abrirConsultarExistencias(): void {
    const data: ConsultarExistenciasDialogData = { productos: this.catalogo() };
    this.dialog.open(ConsultarExistenciasDialogComponent, {
      data,
      width: '700px',
      maxWidth: '95vw',
    });
  }

  /**
   * Diálogo "Buscar Pedido Especial" (FE-E4): agrega al ticket TODOS los productos habilitados
   * del pedido de golpe (réplica de `AgregarPedidoEspecial()` del legado, sin selección
   * individual). No aplica en modo Devolución (el ticket de ese modo no captura productos
   * nuevos, mismo criterio que `agregarPorCodigoBarras()`).
   */
  abrirBuscarPedidoEspecial(): void {
    if (this.modo() === 'devolucion') {
      this.notify.notify(
        'warning',
        this.translate.instant('ventas.pos.pedidoEspecial.msg.noDisponibleDevolucion'),
      );
      return;
    }

    const ref = this.dialog.open(BuscarPedidoEspecialDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
    });

    ref.afterClosed().subscribe((res: ResultModalModel) => {
      if (res?.status !== ENUM_ESTATUS_MODAL.OK) return;

      const { folio, productos } = res.data as BuscarPedidoEspecialResult;

      for (const item of productos) {
        // Completa los campos que no trae `PedidoEspecialProducto` (idLineaProducto,
        // ultimoCostoCompra, fraccion, codigoBarras) cruzando por idProducto contra el catálogo
        // ya cargado del POS — es el mismo producto, evita inventar un endpoint nuevo (regla 00).
        const enCatalogo = this.catalogo().find((p) => p.idProducto === item.idProducto);
        const producto = new ProductoVentaModel({
          idProducto: item.idProducto,
          descripcion: item.descripcion,
          codigoBarras: enCatalogo?.codigoBarras ?? '',
          idLineaProducto: enCatalogo?.idLineaProducto ?? 0,
          precioIndividual: item.precioIndividual,
          precioMenudeo: item.precioMenudeo,
          ultimoCostoCompra: enCatalogo?.ultimoCostoCompra ?? 0,
          existencia: item.cantidad,
          fraccion: enCatalogo?.fraccion ?? false,
          rangos: enCatalogo?.rangos ?? [],
        });

        // Réplica exacta del legado: cantidad = min(existencia disponible, cantidad aceptada).
        const cantidad = Math.min(item.cantidad, item.cantidadRecibida);
        this.agregarProducto(producto, cantidad);
      }

      this.idPedidoEspecialActual.set(folio);
      this.focusScan();
    });
  }

  // ====================== Ticket ======================

  /**
   * Agrega el producto AL INSTANTE (réplica del legado: el cajero no espera nada entre escanear
   * y ver la línea en el ticket) y, si sus rangos de precio por volumen aún no se resolvieron en
   * esta sesión, los pide en segundo plano (`GET /productos/{id}/precios`, LAZY y cacheado — no
   * hay endpoint bulk en la API, ver `pos-catalogo.service.ts`) y recalcula el ticket cuando
   * lleguen. Antes esta llamada BLOQUEABA el alta hasta que la respuesta volvía (regresión
   * detectada por el usuario comparando contra el legado: "tarda unos segundos en agregar
   * productos"); el precio mostrado antes de resolver rangos usa el umbral genérico de mayoreo
   * (precioIndividual/precioMenudeo por cantidad total, igual que sin rangos propios) y se ajusta
   * solo si aplica un rango específico — la validación de existencia real sigue ocurriendo aquí
   * mismo contra `catalogo()` ya cargado (sin llamada de red), y `GuardarVenta` revalida en el
   * servidor al cobrar, así que no hay ventana insegura, solo una corrección de precio casi
   * instantánea si el producto tiene un rango propio.
   */
  private agregarConRangos(producto: ProductoVenta, cantidad: number): void {
    this.completarAgregado(producto, cantidad);

    if (this.rangosResueltos.has(producto.idProducto)) return;

    this.posCatalogo.obtenerRangosProducto(producto.idProducto).subscribe({
      next: (rangos) => {
        this.rangosResueltos.add(producto.idProducto);
        this.catalogo.update((lista) =>
          lista.map((p) =>
            p.idProducto === producto.idProducto ? new ProductoVentaModel({ ...p, rangos }) : p,
          ),
        );
        this.recalcularTicket();
      },
      error: (err) => {
        // No bloquea la venta: sin rangos propios, recalcularTicket() usa el umbral genérico
        // de mayoreo (precioIndividual/precioMenudeo según cantidad total >= 6).
        console.error('Error al consultar precios por volumen del producto', err);
        this.rangosResueltos.add(producto.idProducto); // evita reintentos en cada escaneo
      },
    });
  }

  private completarAgregado(producto: ProductoVenta, cantidad: number): void {
    this.agregarProducto(producto, cantidad);
    this.scanControl.setValue('');
    this.focusScan();
  }

  agregarProducto(producto: ProductoVenta, cantidad: number): void {
    if (cantidad <= 0) {
      this.notify.notify('warning', this.translate.instant('ventas.pos.msg.cantidadRequerida'));
      return;
    }
    if (producto.precioIndividual <= 0 && producto.precioMenudeo <= 0) {
      this.notify.notify('warning', this.translate.instant('ventas.pos.msg.sinPrecio'));
      return;
    }

    const existente = this.ticket().find((l) => l.idProducto === producto.idProducto);
    const cantidadFinal = this.round2((existente?.cantidad ?? 0) + cantidad);

    if (cantidadFinal > producto.existencia) {
      this.notify.notify('warning', this.translate.instant('ventas.pos.msg.sinExistencia'));
      return;
    }

    if (existente) {
      this.ticket.update((lineas) =>
        lineas.map((l) =>
          l.idProducto === producto.idProducto
            ? new LineaTicketModel({ ...l, cantidad: cantidadFinal })
            : l,
        ),
      );
    } else {
      this.ticket.update((lineas) => [
        ...lineas,
        new LineaTicketModel({
          idProducto: producto.idProducto,
          descripcion: producto.descripcion,
          codigoBarras: producto.codigoBarras,
          idLineaProducto: producto.idLineaProducto,
          cantidad: cantidadFinal,
          precioBase: producto.precioIndividual,
          precioUnitario: producto.precioIndividual,
          ultimoCostoCompra: producto.ultimoCostoCompra,
          existenciaDisponible: producto.existencia,
          fraccion: producto.fraccion,
        }),
      ]);
    }

    this.recalcularTicket();
  }

  /** Edición manual de cantidad en la tabla del ticket. */
  onCantidadBlur(linea: LineaTicket): void {
    let cantidad = Number(linea.cantidad);

    if (isNaN(cantidad) || cantidad <= 0) {
      this.notify.notify('warning', this.translate.instant('ventas.pos.msg.cantidadRequerida'));
      cantidad = 1;
    }

    cantidad = linea.fraccion ? this.round2(cantidad) : Math.round(cantidad);

    if (cantidad > linea.existenciaDisponible) {
      this.notify.notify('warning', this.translate.instant('ventas.pos.msg.sinExistencia'));
      cantidad = linea.existenciaDisponible;
    }

    linea.cantidad = cantidad;
    this.recalcularTicket();
    this.focusScan();
  }

  eliminarLinea(idProducto: number): void {
    this.ticket.update((lineas) => lineas.filter((l) => l.idProducto !== idProducto));
    this.recalcularTicket();
    this.focusScan();
  }

  /** Sin confirmación, replica el comportamiento del legado (ver Supuestos de la HU). */
  limpiarTicket(): void {
    this.ticket.set([]);
    this.idPedidoEspecialActual.set(0);
    this.scanControl.setValue('');
    this.productoSeleccionado.set(null);
    this.cantidadManual = 1;
    this.focusScan();
  }

  importeLinea(linea: LineaTicket): number {
    return this.round2(linea.cantidad * linea.precioUnitario);
  }

  descuentoLinea(linea: LineaTicket): number {
    return this.round2((linea.precioBase - linea.precioUnitario) * linea.cantidad);
  }

  /**
   * Réplica de `descripcionConExistencias` del legado (SP_CONSULTA_PRODUCTOS, bloque
   * `@idUsuario > 0`, verificado contra sys.sql_modules en BD real): desglose D/E/SA/R/B +
   * precios, o "(S/E)" si no hay existencia total. Antes solo mostraba `p.existencia` (un
   * número), muy por debajo del detalle que el cajero ve en el sistema legado — hallazgo de
   * usuario comparando ambos buscadores lado a lado.
   */
  existenciaLabel(p: ProductoVenta): string {
    if (!p.existenciaTotal || p.existenciaTotal <= 0) return '(S/E)';
    const precio = (v: number) => v.toFixed(2);
    return (
      `( D:${p.existencia} / E:${p.existenciaTotal} / SA:${p.sinAcomodar} / R:${p.resguardo} / ` +
      `B:${p.bloqueo} / ME:${precio(p.precioIndividual)} / MA:${precio(p.precioMenudeo)})`
    );
  }

  /**
   * Réplica de `actualizaTicketVenta()`: recalcula el precio unitario de CADA línea evaluando
   * primero el rango de precio propio del producto (si su cantidad cae dentro) y, si no aplica
   * ninguno, el default de mayoreo cuando la cantidad TOTAL del ticket (todas las líneas) es
   * >= 6 artículos.
   *
   * Modo Complemento: la cantidad evaluada (umbral de mayoreo y rango por producto) SUMA las
   * cantidades ya vendidas en el ticket localizado (`extraPorComplemento`), réplica exacta de
   * `actualizaTicketVenta()` cuando `idVentaComplemento > 0` — esas cantidades cuentan para el
   * precio pero NO se agregan como líneas visibles del ticket (el legado tampoco las renderiza).
   */
  private recalcularTicket(): void {
    const catalogo = this.catalogo();
    const extraPorComplemento = this.cantidadesComplemento();
    const cantidadTotalTicket =
      this.ticket().reduce((acc, l) => acc + l.cantidad, 0) +
      this.sumaValores(extraPorComplemento);

    const actualizadas = this.ticket().map((linea) => {
      const producto = catalogo.find((p) => p.idProducto === linea.idProducto);
      if (!producto) return linea;

      let precioUnitario =
        cantidadTotalTicket >= 6 ? producto.precioMenudeo : producto.precioIndividual;

      const cantidadEvaluada = linea.cantidad + (extraPorComplemento.get(linea.idProducto) ?? 0);

      const rangoAplicable = producto.rangos.find(
        (r) => cantidadEvaluada >= r.min && cantidadEvaluada <= r.max,
      );

      if (rangoAplicable) {
        precioUnitario = rangoAplicable.costo;
      } else if (producto.rangos.length > 0 && cantidadEvaluada > 6) {
        // Caso "excede el rango máximo definido": usa el costo del rango de mayor `max`.
        const rangoMax = producto.rangos.reduce((max, r) => (r.max > max.max ? r : max));
        if (cantidadEvaluada > rangoMax.max) {
          precioUnitario = rangoMax.costo;
        }
      }

      return new LineaTicketModel({ ...linea, precioUnitario });
    });

    this.ticket.set(actualizadas);
  }

  /** Cantidades del ticket localizado (modos Complemento/Agregar Productos), agrupadas por producto. */
  private cantidadesComplemento(): Map<number, number> {
    const mapa = new Map<number, number>();
    if (this.modo() !== 'complemento' && this.modo() !== 'agregar-productos') return mapa;
    const venta = this.ventaLocalizada();
    if (!venta) return mapa;
    for (const d of venta.detalles) {
      mapa.set(d.idProducto, (mapa.get(d.idProducto) ?? 0) + d.cantidad);
    }
    return mapa;
  }

  private sumaValores(mapa: Map<number, number>): number {
    let total = 0;
    for (const v of mapa.values()) total += v;
    return total;
  }

  // ====================== Cobro (modos Venta / Complemento) ======================

  abrirCobro(): void {
    if (this.ticket().length === 0) {
      this.notify.notify('warning', this.translate.instant('ventas.pos.msg.ticketVacio'));
      return;
    }
    if ((this.modo() === 'complemento' || this.modo() === 'agregar-productos') && !this.ventaLocalizada()) {
      this.notify.notify(
        'warning',
        this.translate.instant('ventas.pos.buscarTicket.msg.requeridoComplemento'),
      );
      return;
    }

    const data: CobroDialogData = { subtotalTicket: this.subtotal() };
    const ref = this.dialog.open(CobroDialogComponent, {
      data,
      width: '900px',
      maxWidth: '95vw',
      disableClose: true, // guarda de UX: no se cierra con click-fuera ni Escape
    });

    ref.afterClosed().subscribe((res: ResultModalModel) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) {
        this.guardarVenta(res.data as DatosCobro);
      } else {
        this.focusScan();
      }
    });
  }

  /**
   * POST /ventas real (venta normal, complemento o agregar-productos). El payload difiere según
   * el modo:
   * - **Complemento**: `idVentaComplemento` = venta localizada, `idVenta = 0`,
   *   `tipoVenta = Normal` — así arma el legado el payload cuando el ticket se localiza vía
   *   `BuscarVentaCodigoBarras()` dentro de la pantalla de venta.
   * - **Agregar Productos**: `idVenta` = venta localizada, `idVentaComplemento = 0`,
   *   `tipoVenta = TipoVentaId.AgregarProductosVenta` — réplica del flujo real del legado
   *   (`EvtVentas.js:952-966`), que edita la venta original agregándole líneas nuevas.
   * - **Venta**: `idVenta = 0`, `idVentaComplemento = 0`, `tipoVenta = Normal`.
   */
  private guardarVenta(datos: DatosCobro): void {
    const detalles = this.ticket().map((l) => {
      const costoLinea = this.round2(l.cantidad * l.ultimoCostoCompra);
      return new VentaDetalleRequestModel({
        idProducto: l.idProducto,
        descripcionProducto: l.descripcion,
        idLineaProducto: l.idLineaProducto,
        cantidad: l.cantidad,
        precio: l.precioUnitario,
        precioVenta: l.precioUnitario,
        costo: costoLinea,
        ganancia: this.round2(this.importeLinea(l) - costoLinea),
        descuento: this.descuentoLinea(l),
        montoTotal: this.importeLinea(l),
        idVentaDetalle: 0,
        productosDevueltos: 0,
        productosAgregados: 0,
        ultimoCostoCompra: l.ultimoCostoCompra,
      });
    });

    const esAgregarProductos = this.modo() === 'agregar-productos';
    const esComplemento = this.modo() === 'complemento';

    const request = new GuardarVentaRequestModel({
      detalles,
      idCliente: datos.idCliente,
      formaPago: datos.idFormaPago,
      usoCfdi: datos.idUsoCFDI ?? 0,
      idVenta: esAgregarProductos ? this.ventaLocalizada()?.idVenta ?? 0 : 0,
      aplicaIva: datos.facturar,
      numClientesAtendidos: datos.numClientesAtendidos ?? 0,
      tipoVenta: esAgregarProductos ? TipoVentaId.AgregarProductosVenta : TipoVentaId.Normal,
      motivoDevolucion: null,
      idPedidoEspecial: this.idPedidoEspecialActual(),
      idVentaComplemento: esComplemento ? this.ventaLocalizada()?.idVenta ?? 0 : 0,
      montoTotalVenta: datos.total,
      montoPagado: datos.efectivoRecibido,
    });

    this.enviarVenta(request, datos.cambio);
  }

  // ====================== Modos (FE-A5b) ======================

  cambiarModo(event: MatButtonToggleChange): void {
    const nuevo = event.value as ModoPos;
    if (this.modo() === nuevo) return;
    this.modo.set(nuevo);
    this.limpiarModo();
  }

  /** Resetea ticket + venta localizada + líneas de devolución al cambiar de modo o tras guardar. */
  private limpiarModo(): void {
    this.ticket.set([]);
    this.ventaLocalizada.set(null);
    this.lineasDevolucion.set([]);
    this.buscarTicketControl.setValue('');
    this.motivoDevolucionControl.setValue('');
    this.idPedidoEspecialActual.set(0);
    this.scanControl.setValue('');
    this.productoSeleccionado.set(null);
    this.cantidadManual = 1;
    this.focusScan();
  }

  /**
   * Localiza el ticket original por código de barras (modos Devolución/Complemento). Réplica de
   * `BuscarVentaCodigoBarras()`: `buscarPorCodigoBarras()` devuelve una LISTA (el SP legado no
   * garantiza unicidad); se toma el primer resultado. La cabecera no trae `detalles` (regla del
   * contrato, ver `venta.ts`) — se completa con una segunda consulta a `obtenerPorId()`.
   */
  buscarTicket(): void {
    const codigo = this.buscarTicketControl.value.trim();
    if (!codigo) return;

    this.buscandoTicket.set(true);
    this.ventasService
      .buscarPorCodigoBarras(codigo)
      .pipe(finalize(() => this.buscandoTicket.set(false)))
      .subscribe({
        next: (ventas) => {
          const encontrada = ventas[0];
          if (!encontrada) {
            this.notify.notify(
              'error',
              this.translate.instant('ventas.pos.buscarTicket.msg.noEncontrado'),
            );
            return;
          }
          this.cargarVentaLocalizada(encontrada.idVenta);
        },
        error: (err) => {
          console.error('Error al buscar el ticket por código de barras', err);
          this.notify.notify(
            'error',
            this.translate.instant('ventas.pos.buscarTicket.msg.errorBuscar'),
          );
        },
      });
  }

  private cargarVentaLocalizada(idVenta: number): void {
    this.ventasService.obtenerPorId(idVenta).subscribe({
      next: (venta) => {
        if (!venta) {
          this.notify.notify(
            'error',
            this.translate.instant('ventas.pos.buscarTicket.msg.noEncontrado'),
          );
          return;
        }
        this.ventaLocalizada.set(venta);
        this.buscarTicketControl.setValue('');

        if (this.modo() === 'devolucion') {
          this.lineasDevolucion.set(
            venta.detalles.map((d) => new LineaDevolucionModel({ detalle: d, cantidadDevolver: 0 })),
          );
        } else {
          // Complemento: no se renderizan líneas nuevas, solo cuenta para el descuento por volumen.
          this.recalcularTicket();
        }
      },
      error: (err) => {
        console.error('Error al consultar el ticket localizado', err);
        this.notify.notify(
          'error',
          this.translate.instant('ventas.pos.buscarTicket.msg.errorBuscar'),
        );
      },
    });
  }

  // ====================== Devolución ======================

  /** Comisión bancaria prorrateada de la línea, réplica de `actualizarSubTotalDevoluciones()`. */
  comisionDevueltaLinea(linea: LineaDevolucion): number {
    if (!linea.detalle.cantidad) return 0;
    return this.round2(
      (linea.cantidadDevolver * linea.detalle.montoComisionBancaria) / linea.detalle.cantidad,
    );
  }

  importeDevolverLinea(linea: LineaDevolucion): number {
    return this.round2(linea.cantidadDevolver * linea.detalle.precioVenta + this.comisionDevueltaLinea(linea));
  }

  /** Edición manual de la cantidad a devolver: tope = lo comprado en esa línea (validación dura). */
  onCantidadDevolverBlur(linea: LineaDevolucion): void {
    let cantidad = Number(linea.cantidadDevolver);

    if (isNaN(cantidad) || cantidad < 0) {
      cantidad = 0;
    }

    const fraccion = this.catalogo().find((p) => p.idProducto === linea.detalle.idProducto)?.fraccion ?? false;
    cantidad = fraccion ? this.round2(cantidad) : Math.round(cantidad);

    if (cantidad > linea.detalle.cantidad) {
      this.notify.notify('warning', this.translate.instant('ventas.pos.devolucion.msg.excedeComprado'));
      cantidad = linea.detalle.cantidad;
    }

    this.lineasDevolucion.update((lineas) =>
      lineas.map((l) =>
        l.detalle.idVentaDetalle === linea.detalle.idVentaDetalle
          ? new LineaDevolucionModel({ ...l, cantidadDevolver: cantidad })
          : l,
      ),
    );
  }

  /**
   * Guarda la devolución directo (sin modal de cobro — el legado tampoco cobra en una
   * devolución, `montoPagado = 0`). Réplica de `#btnAceptarDevolucion`/`actualizarSubTotalDevoluciones()`.
   */
  confirmarDevolucion(): void {
    const venta = this.ventaLocalizada();
    if (!venta) return;

    const motivo = this.motivoDevolucionControl.value.trim();
    if (!motivo) {
      this.notify.notify('warning', this.translate.instant('ventas.pos.devolucion.msg.motivoRequerido'));
      return;
    }

    const lineas = this.lineasDevolucion().filter((l) => l.cantidadDevolver > 0);
    if (lineas.length === 0) {
      this.notify.notify(
        'warning',
        this.translate.instant('ventas.pos.devolucion.msg.seleccionaProducto'),
      );
      return;
    }

    const detalles = lineas.map((l) => {
      const idLineaProducto =
        this.catalogo().find((p) => p.idProducto === l.detalle.idProducto)?.idLineaProducto ?? 0;
      const costoLinea = this.round2(l.detalle.cantidad * l.detalle.ultimoCostoCompra);
      return new VentaDetalleRequestModel({
        idProducto: l.detalle.idProducto,
        descripcionProducto: l.detalle.descProducto,
        idLineaProducto,
        cantidad: l.detalle.cantidad, // cantidad ORIGINAL de la línea (réplica exacta del legado)
        precio: l.detalle.precioVenta,
        precioVenta: l.detalle.precioVenta,
        costo: costoLinea,
        ganancia: this.round2(l.detalle.monto - costoLinea),
        descuento: 0,
        montoTotal: l.detalle.monto,
        idVentaDetalle: l.detalle.idVentaDetalle,
        productosDevueltos: l.cantidadDevolver,
        productosAgregados: 0,
        ultimoCostoCompra: l.detalle.ultimoCostoCompra,
      });
    });

    const request = new GuardarVentaRequestModel({
      detalles,
      idCliente: venta.idCliente,
      formaPago: venta.idFactFormaPago,
      usoCfdi: venta.idFactUsoCFDI,
      idVenta: venta.idVenta,
      aplicaIva: false,
      numClientesAtendidos: 0,
      tipoVenta: TipoVentaId.Devolucion,
      motivoDevolucion: motivo,
      idPedidoEspecial: 0,
      idVentaComplemento: 0,
      montoTotalVenta: this.totalADevolver(),
      montoPagado: 0, // el legado tampoco cobra en una devolución (efectivo_ = 0)
    });

    this.enviarVenta(request, null);
  }

  // ====================== Guardado compartido ======================

  /** POST /ventas compartido por los 3 modos. Bloquea doble-submit (regla 04). */
  private enviarVenta(request: GuardarVentaRequest, cambio: number | null): void {
    if (this.guardandoVenta()) return;

    this.guardandoVenta.set(true);
    this.blockUI.start(this.translate.instant('ventas.pos.msg.guardandoVenta'));
    this.ventasService
      .guardar(request)
      .pipe(
        finalize(() => {
          this.guardandoVenta.set(false);
          this.blockUI.stop();
        }),
      )
      .subscribe({
        next: (res: Notificacion<Venta>) => {
          if (res?.estatus === 200) {
            if (cambio !== null) {
              // Solo el flujo de cobro (venta/complemento) deja ticket para ver/reimprimir;
              // la devolución no pasa por `abrirCobro()` (ver comentario de clase).
              this.ultimoCambio.set(cambio);
              this.ultimoTicket.set({
                idVenta: res.modelo?.idVenta ?? 0,
                tieneLiquidos: (res.modelo?.cantProductosLiq ?? 0) > 0,
              });
            }
            this.notify.notify(
              'success',
              res.mensaje || this.translate.instant('ventas.pos.msg.ventaRealizada'),
            );
            // Hallazgo de la investigación (ver comentario de clase): "líquidos/despachadores"
            // no es un modo de captura, es automático — aviso informativo, el PDF es Bloque D.
            if ((res.modelo?.cantProductosLiq ?? 0) > 0) {
              this.notify.notify('info', this.translate.instant('ventas.pos.msg.incluyeLiquidos'));
            }
            this.modo.set('venta');
            this.limpiarModo();
            // Réplica de InitSelect2Productos() tras guardar en el legado: refresca el
            // catálogo (existencias/precios cambiaron).
            this.cargarCatalogo();
          } else {
            this.notify.notify(
              'error',
              res?.mensaje ?? this.translate.instant('ventas.pos.msg.errorGuardarVenta'),
            );
          }
          this.focusScan();
        },
        error: (err) => {
          console.error('Error al guardar la venta', err);
          this.notify.notify('error', this.translate.instant('ventas.pos.msg.errorGuardarVenta'));
          this.focusScan();
        },
      });
  }

  // ====================== Ticket PDF (FE-D1) ======================

  /** "Ver ticket"/"Ticket despachador" tras cobrar (ver `ultimoTicket`). Abre el PDF en pestaña nueva. */
  verTicket(tipo: TicketVentaTipo = 'venta'): void {
    const ticket = this.ultimoTicket();
    if (!ticket || this.generandoTicket()) return;

    this.generandoTicket.set(true);
    this.ventasService
      .obtenerTicketPdf(ticket.idVenta, tipo)
      .pipe(finalize(() => this.generandoTicket.set(false)))
      .subscribe({
        next: (blob) => abrirPdfBlob(blob),
        error: (err) => {
          console.error('Error al generar el ticket PDF de la venta', err);
          this.notify.notify('error', this.translate.instant('ventas.pos.msg.errorTicket'));
        },
      });
  }

  private round2(n: number): number {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }
}
