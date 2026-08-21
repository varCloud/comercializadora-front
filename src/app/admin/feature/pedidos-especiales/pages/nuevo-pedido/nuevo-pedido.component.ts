import { CurrencyPipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { debounceTime, distinctUntilChanged, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { abrirPdfBlob, imprimirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';
import { CONSTANTS } from 'src/app/config/constants';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Producto } from 'src/app/admin/models/productos/producto';
import {
  PartidaPedidoEspecial,
  PartidaPedidoEspecialModel,
} from 'src/app/admin/models/pedidos-especiales/partida-pedido-especial';
import { ProductoConfirmar } from 'src/app/admin/models/pedidos-especiales/producto-confirmar';
import { GuardarPedidoEspecialRequestModel } from 'src/app/admin/models/pedidos-especiales/guardar-pedido-especial-request';
import { PedidoEspecialProductoRequestModel } from 'src/app/admin/models/pedidos-especiales/pedido-especial-producto-request';
import { TipoIngresoPedidoEspecialId } from 'src/app/admin/models/pedidos-especiales/tipo-ingreso-pedido-especial';
import { ProductosService } from 'src/app/admin/services/productos.service';
import { UbicacionesService } from 'src/app/admin/services/ubicaciones.service';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';
import { PrintAgentService } from 'src/app/admin/services/print-agent.service';
import { IngresoEfectivoDialogComponent } from '../../components/ingreso-efectivo-dialog/ingreso-efectivo-dialog.component';
import { RetiroExcesoEfectivoDialogComponent } from '../../components/retiro-exceso-efectivo-dialog/retiro-exceso-efectivo-dialog.component';
import { AprobarPrecioMayoreoDialogComponent } from '../../components/aprobar-precio-mayoreo-dialog/aprobar-precio-mayoreo-dialog.component';
import {
  GenerarPedidoEspecialDialogComponent,
  GenerarPedidoEspecialResultado,
} from '../../components/generar-pedido-especial-dialog/generar-pedido-especial-dialog.component';

/**
 * "Nuevo Pedido Especial" — réplica 1:1 (regla 21) de `PedidosEspeciales.cshtml` +
 * `EvtPedidosEspecialesV2.js` + `evtIngresosRetirosEfectivo.js`.
 *
 * - Al entrar valida `ValidaCajaAbierta()` y, si no hay caja, fuerza el modal de apertura.
 * - Cliente y tipo de revisión se piden en el modal "Generar Pedido Especial", no en la pantalla.
 * - No hay Forma de Pago / Facturar / Uso CFDI: restos del modal de venta del legado, nunca
 *   viajan en el payload; el IVA se ajusta después desde "Consultar Pedidos".
 * - Guardado: 1,1 = por Ticket; 2,1 = por Hand Held; 3,2 = Cotización.
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
  ],
  templateUrl: './nuevo-pedido.component.html',
  styleUrl: './nuevo-pedido.component.scss',
})
export class NuevoPedidoComponent implements OnInit {
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly productosService = inject(ProductosService);
  private readonly ubicacionesService = inject(UbicacionesService);
  private readonly pedidosEspecialesService = inject(PedidosEspecialesService);
  private readonly printAgent = inject(PrintAgentService);

  @BlockUI('nuevo-pedido') blockUI!: NgBlockUI;

  @ViewChild('buscarProductoInput') private readonly buscarProductoInputRef!: ElementRef<HTMLInputElement>;

  // ====================== Almacén / buscador de producto ======================

  readonly almacenes = signal<Catalogo[]>([]);
  readonly idAlmacen = new FormControl<number | null>(null);
  private readonly idAlmacenValue = toSignal(this.idAlmacen.valueChanges, {
    initialValue: this.idAlmacen.value,
  });

  readonly buscarProductoControl = new FormControl<Producto | string>('', { nonNullable: true });
  readonly productoSeleccionado = signal<Producto | null>(null);
  readonly buscandoProductos = signal(false);
  cantidadManual = 1;

  /**
   * Búsqueda server-side por descripción (`ProductosService.buscarPorDescripcion`, regla 00), con
   * debounce + `distinctUntilChanged` (regla 13). Equivale al autocompletado jQuery UI del legado
   * (`InitSelect2Productos`), que precarga los productos del almacén seleccionado.
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

  // ====================== Partidas / totales ======================

  readonly partidas = signal<PartidaPedidoEspecialModel[]>([]);
  /** Mismas columnas (y orden) que la tabla `#tablaRepVentas` del legado. */
  readonly displayedColumns = [
    'indice',
    'idProducto',
    'producto',
    'almacen',
    'precio',
    'cantidad',
    'total',
    'descuento',
    'acciones',
  ];
  readonly agregando = signal(false);
  readonly guardando = signal(false);

  /** Folio del ticket autorizado a precio de mayoreo (`idPedidoEspecialMayoreo_` del legado). */
  readonly idPedidoEspecialMayoreo = signal(0);

  /**
   * Edición de cotización (P-07) — réplica de `PedidosEspeciales(PedidosEspecialesV2
   * pedidoEspecial)` + `AgregarProductosPedidoEspecial()` (`EvtPedidosEspecialesV2.js:1573-1587`):
   * cuando se llega desde "Editar cotización" (`cotizaciones.component.ts`) con
   * `?idPedidoEspecial=&idCliente=&idEstatusPedidoEspecial=` en la URL, se precargan sus
   * productos y el guardado reusa el MISMO folio (`idPedidoEspecial` != 0) en vez de crear uno
   * nuevo. `0` (default) = alta normal, igual que el legado (`Model.idPedidoEspecial == 0`).
   */
  readonly idPedidoEspecialEdicion = signal(0);
  readonly idEstatusPedidoEspecialEdicion = signal(0);

  readonly subtotal = computed(() =>
    this.round2(this.partidas().reduce((acc, p) => acc + this.importePartida(p), 0)),
  );

  ngOnInit(): void {
    this.cargarAlmacenes();
    this.validarCajaAbierta();

    const idPedidoEspecial = Number(this.route.snapshot.queryParamMap.get('idPedidoEspecial')) || 0;
    const idEstatusPedidoEspecial = Number(this.route.snapshot.queryParamMap.get('idEstatusPedidoEspecial')) || 0;
    if (idPedidoEspecial > 0) {
      this.idPedidoEspecialEdicion.set(idPedidoEspecial);
      this.idEstatusPedidoEspecialEdicion.set(idEstatusPedidoEspecial);
      this.cargarProductosDeCotizacion(idPedidoEspecial);
    }
  }

  // ====================== Guard de caja abierta (legado: ValidaCajaAbierta) ======================

  private validarCajaAbierta(): void {
    this.blockUI.start(this.translate.instant('pedidosEspeciales.caja.ingresoDialog.msg.validando'));
    this.pedidosEspecialesService
      .refrescarCajaAbierta()
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (abierta) => {
          if (!abierta) this.abrirAperturaCaja();
        },
        error: (err) => {
          console.error('Error al validar la caja abierta de Pedidos Especiales', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.ingresoDialog.msg.errorValidar'));
        },
      });
  }

  /** Modal bloqueante de apertura; si se sale sin registrarla, no se permite operar la pantalla. */
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
        this.notify.notify('warning', this.translate.instant('pedidosEspeciales.caja.ingresoDialog.msg.aperturaRequerida'));
        this.router.navigate(['/admin/pedidos-especiales/consultar-pedidos']);
      });
  }

  // ====================== Acciones del header (1:1 con el legado) ======================

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

  /**
   * "Abrir cajón" — el legado manda una secuencia ESC/POS a la impresora térmica del servidor
   * (`PedidosEspecialesV2Controller.AbrirCajon`). Se replica vía el agente local de impresión
   * POS (`PrintAgentService`, ver `abrir-pdf-blob.ts`); si la estación no tiene el agente
   * instalado/encendido (rollout gradual), se avisa en vez de fallar en silencio.
   */
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

  /** "Aprobar Precio Mayoreo" — `ModalAutorizarPrecioMayoreo()`. */
  abrirAprobarPrecioMayoreo(): void {
    this.dialog
      .open(AprobarPrecioMayoreoDialogComponent, { width: '900px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe((res: ResultModalModel | undefined) => {
        if (res?.status !== ENUM_ESTATUS_MODAL.OK) return;
        this.idPedidoEspecialMayoreo.set(Number(res.data) || 0);
        this.recalcularPrecios();
      });
  }

  // ====================== Catálogos / existencias ======================

  private cargarAlmacenes(): void {
    // Sucursal fija Uruapan (regla 15): aquí no hay selector de sucursal, solo su id.
    this.ubicacionesService.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID).subscribe({
      next: (lista) => this.almacenes.set(lista),
      error: (err) => {
        console.error('Error al cargar el catálogo de almacenes', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.loadError'));
      },
    });
  }

  /** Botón de recarga del legado (`ActualizarProductosAlmacen`): refresca existencias del almacén. */
  actualizarExistencias(): void {
    const almacen = this.idAlmacenValue();
    if (!almacen) {
      this.notify.notify('info', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.almacenRequerido'));
      return;
    }

    this.partidas().forEach((p) => this.refrescarExistenciaPartida(p.idProducto, p.idAlmacen));
    this.notify.notify('info', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.existenciasActualizadas'));
  }

  private refrescarExistenciaPartida(idProducto: number, idAlmacen: number): void {
    this.pedidosEspecialesService.consultarExistencia(idProducto, idAlmacen).subscribe({
      next: (res) => {
        const existencia = res?.modelo?.cantidad ?? 0;
        const inhabilitado = res?.modelo?.inhabilitado ?? true;
        this.partidas.update((lista) =>
          lista.map((p) =>
            p.idProducto === idProducto && p.idAlmacen === idAlmacen
              ? new PartidaPedidoEspecialModel({ ...p, existencia, inhabilitado })
              : p,
          ),
        );
      },
      error: (err) => console.error('Error al consultar la existencia del producto', err),
    });
  }

  // ====================== Edición de cotización (P-07) ======================

  /**
   * `GET /pedidos-especiales/{folio}/productos-confirmar` — mismo SP reusado que el legado
   * (`SP_CONSULTA_PEDIDOS_ESPECIALES_DETALLE_V2` vía `ObtenerProductosPedidoEspecial`). Precarga
   * cada línea de la cotización en `partidas()` para continuar editándola.
   */
  private cargarProductosDeCotizacion(folio: number): void {
    this.blockUI.start(this.translate.instant('pedidosEspeciales.nuevoPedido.msg.cargandoCotizacion'));
    this.pedidosEspecialesService
      .obtenerProductosConfirmar(folio)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (lineas) => {
          if (lineas.length === 0) {
            this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.cotizacionSinProductos'));
            return;
          }
          lineas.forEach((linea) => this.precargarPartidaCotizacion(linea));
        },
        error: (err) => {
          console.error('Error al cargar los productos de la cotización', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.cotizacionError'));
        },
      });
  }

  /**
   * Réplica de `AgregarProducto(productosPedidoEspecial[i], cantidad, true)`: la cantidad se topa
   * a la existencia actual del almacén destino si es menor a la originalmente pedida
   * (`cantidad > cantidadActualInvAlmacen ? cantidadActualInvAlmacen : cantidad`). Los rangos de
   * precio por volumen se recargan vía `ProductosService.obtenerPrecios` (mismo catálogo que usa
   * `agregarProducto()`; el SP de detalle no los expone).
   */
  private precargarPartidaCotizacion(linea: ProductoConfirmar): void {
    const existencia = linea.cantidadActualInvAlmacen;
    const cantidad = existencia != null && linea.cantidad > existencia ? existencia : linea.cantidad;

    this.productosService.obtenerPrecios(linea.idProducto).subscribe({
      next: (precios) => {
        this.partidas.update((lista) => [
          new PartidaPedidoEspecialModel({
            idProducto: linea.idProducto,
            descripcion: linea.descripcion,
            idAlmacen: linea.idAlmacen,
            almacen: linea.almacen,
            cantidad,
            precioIndividual: precios.precioIndividual ?? linea.precioIndividual,
            precioMenudeo: precios.precioMenudeo ?? linea.precioMenudeo,
            precio: precios.precioIndividual ?? linea.precioIndividual,
            existencia: existencia ?? 0,
            inhabilitado: false,
            rangos: precios.rangos,
          }),
          ...lista,
        ]);
        this.recalcularPrecios();
      },
      error: (err) => {
        console.error('Error al cargar los precios de un producto de la cotización', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.preciosError'));
      },
    });
  }

  // ====================== Buscador de producto ======================

  onSugerenciaProductoSeleccionada(producto: Producto): void {
    this.productoSeleccionado.set(producto);
  }

  mostrarProducto(valor: Producto | string | null): string {
    if (!valor || typeof valor === 'string') return valor ?? '';
    return valor.descripcion;
  }

  /**
   * "Agregar" del legado (`AgregarProducto`): valida producto, cantidad, existencia en el almacén
   * y precios configurados; si el producto ya está en la tabla **con el mismo almacén**, suma la
   * cantidad en vez de duplicar la fila.
   */
  agregarProducto(): void {
    if (this.agregando()) return;

    const idAlmacen = this.idAlmacenValue();
    if (!idAlmacen) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.almacenRequerido'));
      return;
    }

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

    const existente = this.partidas().find(
      (p) => p.idProducto === producto.idProducto && p.idAlmacen === idAlmacen,
    );
    const cantidadFinal = this.round2((existente?.cantidad ?? 0) + cantidad);

    this.agregando.set(true);
    // Existencia + precios en paralelo: el legado valida ambos antes de pintar la fila.
    forkJoin({
      existencia: this.pedidosEspecialesService.consultarExistencia(producto.idProducto, idAlmacen),
      precios: this.productosService.obtenerPrecios(producto.idProducto),
    })
      .pipe(finalize(() => this.agregando.set(false)))
      .subscribe({
        next: ({ existencia, precios }) => {
          const disponible = existencia?.modelo?.cantidad ?? 0;
          const inhabilitado = existencia?.modelo?.inhabilitado ?? true;

          if (cantidadFinal > disponible) {
            this.notify.notify(
              'warning',
              this.translate.instant('pedidosEspeciales.nuevoPedido.msg.sinInventario'),
            );
            return;
          }

          const precioIndividual = precios.precioIndividual ?? producto.precioIndividual ?? 0;
          const precioMenudeo = precios.precioMenudeo ?? producto.precioMenudeo ?? 0;
          if (precioIndividual <= 0 || precioMenudeo <= 0) {
            this.notify.notify(
              'warning',
              this.translate.instant('pedidosEspeciales.nuevoPedido.msg.sinPrecio'),
            );
            return;
          }

          if (existente) {
            this.partidas.update((lista) =>
              lista.map((p) =>
                p.idProducto === producto.idProducto && p.idAlmacen === idAlmacen
                  ? new PartidaPedidoEspecialModel({ ...p, cantidad: cantidadFinal, existencia: disponible, inhabilitado })
                  : p,
              ),
            );
          } else {
            this.partidas.update((lista) => [
              new PartidaPedidoEspecialModel({
                idProducto: producto.idProducto,
                descripcion: producto.descripcion,
                codigoBarras: producto.codigoBarras,
                idAlmacen,
                almacen: this.nombreAlmacen(idAlmacen),
                cantidad,
                precioIndividual,
                precioMenudeo,
                precio: precioIndividual,
                existencia: disponible,
                inhabilitado,
                rangos: precios.rangos,
              }),
              ...lista,
            ]);
          }

          this.recalcularPrecios();
          this.resetearBuscadorProducto();
        },
        error: (err) => {
          console.error('Error al agregar el producto al pedido especial', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.preciosError'));
        },
      });
  }

  private nombreAlmacen(idAlmacen: number): string {
    return this.almacenes().find((a) => a.id === idAlmacen)?.descripcion ?? '';
  }

  private resetearBuscadorProducto(): void {
    this.buscarProductoControl.setValue('');
    this.productoSeleccionado.set(null);
    this.cantidadManual = 1;
    this.focusBuscarProducto();
  }

  private focusBuscarProducto(): void {
    setTimeout(() => this.buscarProductoInputRef?.nativeElement?.focus());
  }

  // ====================== Tabla de partidas ======================

  /** Edición de la cantidad en la tabla (`initInputsTabla` del legado: revalida contra existencia). */
  onCantidadPartidaBlur(partida: PartidaPedidoEspecial): void {
    let cantidad = Number(partida.cantidad);

    if (isNaN(cantidad) || cantidad <= 0) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.nuevoPedido.buscarProducto.msg.cantidadRequerida'),
      );
      cantidad = 1;
    }

    if (partida.existencia >= 0 && cantidad > partida.existencia) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.sinInventario'));
      cantidad = partida.existencia > 0 ? partida.existencia : 1;
    }

    this.partidas.update((lista) =>
      lista.map((p) =>
        p.idProducto === partida.idProducto && p.idAlmacen === partida.idAlmacen
          ? new PartidaPedidoEspecialModel({ ...p, cantidad })
          : p,
      ),
    );
    this.recalcularPrecios();
  }

  eliminarPartida(partida: PartidaPedidoEspecial): void {
    this.partidas.update((lista) =>
      lista.filter((p) => !(p.idProducto === partida.idProducto && p.idAlmacen === partida.idAlmacen)),
    );
    this.recalcularPrecios();
  }

  importePartida(partida: PartidaPedidoEspecial): number {
    return this.round2(partida.cantidad * partida.precio);
  }

  /** Columna "Descuento" del legado: (precioIndividual - precioVenta) × cantidad. */
  descuentoPartida(partida: PartidaPedidoEspecial): number {
    return this.round2((partida.precioIndividual - partida.precio) * partida.cantidad);
  }

  /**
   * Recalcula el precio unitario de CADA partida — réplica de `actualizaTicketVenta()`:
   * cantidad TOTAL del pedido >= 6 **o** ticket autorizado a mayoreo → precioMenudeo, si no
   * precioIndividual; si la cantidad de la partida cae en uno de sus rangos propios, ese costo
   * gana; si excede el `max` de todos sus rangos, se usa el costo del rango de mayor `max`.
   */
  private recalcularPrecios(): void {
    const partidas = this.partidas();
    const cantidadTotal = partidas.reduce((acc, p) => acc + p.cantidad, 0);
    const forzarMayoreo = cantidadTotal >= 6 || this.idPedidoEspecialMayoreo() > 0;

    const actualizadas = partidas.map((p) => {
      let precio = forzarMayoreo ? p.precioMenudeo : p.precioIndividual;

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

  // ====================== Guardar / limpiar ======================

  /** "Generar Pedido Especial" — `abrirModalGuardarPedidoEspecial(1)`. */
  generarPedidoEspecial(): void {
    this.abrirModalGuardar('pedido');
  }

  /** "Guardar Cotización" — `abrirModalGuardarPedidoEspecial(2)`. */
  guardarCotizacion(): void {
    this.abrirModalGuardar('cotizacion');
  }

  private abrirModalGuardar(modo: 'pedido' | 'cotizacion'): void {
    if (this.guardando()) return;

    if (this.subtotal() <= 0) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.sinProductos'));
      return;
    }

    this.dialog
      .open(GenerarPedidoEspecialDialogComponent, { width: '600px', maxWidth: '95vw', data: { modo } })
      .afterClosed()
      .subscribe((res: ResultModalModel | undefined) => {
        if (res?.status !== ENUM_ESTATUS_MODAL.OK) return;
        this.guardar(res.data as GenerarPedidoEspecialResultado);
      });
  }

  private guardar(opciones: GenerarPedidoEspecialResultado): void {
    const request = new GuardarPedidoEspecialRequestModel({
      productos: this.partidas().map(
        (p) =>
          new PedidoEspecialProductoRequestModel({
            idProducto: p.idProducto,
            cantidad: p.cantidad,
            idAlmacen: p.idAlmacen,
          }),
      ),
      tipoRevision: opciones.tipoRevision,
      idCliente: opciones.idCliente,
      idEstatusPedidoEspecial: opciones.idEstatusPedidoEspecial,
      // P-07: réplica de `$('#idPedidoEspecial').val()` — 0 en alta normal, folio real al
      // editar una cotización existente (mismo SP hace upsert según este valor).
      idPedidoEspecial: this.idPedidoEspecialEdicion(),
      idPedidoEspecialMayoreo: this.idPedidoEspecialMayoreo(),
    });

    this.guardando.set(true);
    this.blockUI.start(this.translate.instant('pedidosEspeciales.nuevoPedido.msg.guardando'));
    this.pedidosEspecialesService
      .guardarPedido(request)
      .pipe(
        finalize(() => {
          this.guardando.set(false);
          this.blockUI.stop();
        }),
      )
      .subscribe({
        next: (res) => {
          // Réplica de `$('#idPedidoEspecial').val(0)` en `success` (EvtPedidosEspecialesV2.js:701):
          // se resetea SIEMPRE tras el intento de guardado, no solo si `estatus === 200`.
          this.idPedidoEspecialEdicion.set(0);
          this.idEstatusPedidoEspecialEdicion.set(0);

          if (res?.estatus === 200 && res.modelo) {
            this.notify.notify(
              'success',
              res.mensaje || this.translate.instant('pedidosEspeciales.nuevoPedido.msg.guardadoOk'),
            );
            const folio = res.modelo.idPedidoEspecial;
            this.limpiar();
            this.imprimirTickets(folio, opciones.imprimirTicketCliente);
          } else {
            this.notify.notify(
              'error',
              res?.mensaje ?? this.translate.instant('pedidosEspeciales.nuevoPedido.msg.saveFallback'),
            );
          }
        },
        error: (err) => {
          console.error('Error al guardar el pedido especial', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.saveError'));
        },
      });
  }

  /**
   * El legado siempre imprime el ticket de almacén (`imprimirTicketAlmacenes`) y, solo si se marcó
   * el checkbox, además el ticket del cliente (`ImprimeTicketPedidoEspecial`). Aquí ambos son PDF
   * (adaptación web ya aprobada de la impresión térmica del servidor).
   */
  private imprimirTickets(folio: number, imprimirTicketCliente: boolean): void {
    this.pedidosEspecialesService.obtenerTicketAlmacen(folio).subscribe({
      next: (blob) => imprimirPdfBlob(blob, this.printAgent),
      error: (err) => {
        console.error('Error al generar el ticket de almacén del pedido especial', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.ticketError'));
      },
    });

    if (!imprimirTicketCliente) return;

    this.pedidosEspecialesService.obtenerTicket(folio).subscribe({
      next: (blob) => abrirPdfBlob(blob),
      error: (err) => {
        console.error('Error al generar el ticket del pedido especial', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.ticketError'));
      },
    });
  }

  /** "Limpiar" — `limpiarTicket()` del legado (vacía el ticket, no el almacén seleccionado). */
  limpiar(): void {
    this.partidas.set([]);
    this.idPedidoEspecialMayoreo.set(0);
    this.buscarProductoControl.setValue('');
    this.productoSeleccionado.set(null);
    this.cantidadManual = 1;
    this.focusBuscarProducto();
  }

  private round2(n: number): number {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }
}
