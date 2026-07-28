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
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { ProductoVenta, ProductoVentaModel } from 'src/app/admin/models/ventas/producto-venta';
import { LineaTicket, LineaTicketModel } from 'src/app/admin/models/ventas/linea-ticket';
import { DatosCobro } from 'src/app/admin/models/ventas/datos-cobro';
import { GuardarVentaRequestModel } from 'src/app/admin/models/ventas/guardar-venta-request';
import { VentaDetalleRequestModel } from 'src/app/admin/models/ventas/venta-detalle-request';
import { TipoVentaId } from 'src/app/admin/models/ventas/tipo-venta';
import { VentasService } from 'src/app/admin/services/ventas.service';
import { PosCatalogoService } from '../../services/pos-catalogo.service';
import {
  CobroDialogComponent,
  CobroDialogData,
} from '../../components/cobro-dialog/cobro-dialog.component';

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
 * cantidad por encima de lo disponible y deshabilita productos sin stock en el buscador. Solo
 * cubre el flujo de venta normal — devolución/complemento/líquidos son FE-A5b.
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

  @BlockUI('pos') blockUI!: NgBlockUI;

  @ViewChild('scanInput') private readonly scanInputRef!: ElementRef<HTMLInputElement>;

  readonly catalogo = signal<ProductoVenta[]>([]);
  readonly ticket = signal<LineaTicket[]>([]);
  /** Persiste en pantalla después de cerrar el modal de cobro ("Último Cambio" del legado). */
  readonly ultimoCambio = signal<number | null>(null);
  /** Bloquea doble-submit del guardado de venta (independiente del `enviando` del modal de cobro). */
  private readonly guardandoVenta = signal(false);

  /** idProducto cuyos rangos de precio por volumen ya se consultaron (carga LAZY, ver PosCatalogoService). */
  private readonly rangosResueltos = new Set<number>();

  readonly scanControl = new FormControl('', { nonNullable: true });
  private readonly scanTerm = toSignal(this.scanControl.valueChanges, { initialValue: '' });

  /** Sugerencias de autocompletado local (buscador por descripción/código, alcance de la HU). */
  readonly sugerencias = computed(() => {
    const term = this.scanTerm().trim().toUpperCase();
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

  ngOnInit(): void {
    this.cargarCatalogo();
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

  /** Selección desde el autocompletado: agrega igual que el escaneo (cantidad 1). */
  onSugerenciaSeleccionada(event: MatAutocompleteSelectedEvent): void {
    this.agregarPorCodigoBarras(String(event.option.value));
  }

  /** Enter sobre el campo de escaneo = flujo de pistola lectora (alta automática, cantidad 1). */
  agregarPorCodigoBarras(codigoRaw: string): void {
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

  // ====================== Ticket ======================

  /**
   * Antes de agregar un producto por primera vez al ticket, resuelve sus rangos de precio por
   * volumen reales (`GET /productos/{id}/precios`, LAZY y cacheado — no hay endpoint bulk en la
   * API, ver `pos-catalogo.service.ts`). Si el producto ya se resolvió antes (mismo ticket o
   * escaneos previos), no vuelve a pedirlo.
   */
  private agregarConRangos(producto: ProductoVenta, cantidad: number): void {
    if (this.rangosResueltos.has(producto.idProducto)) {
      this.completarAgregado(producto, cantidad);
      return;
    }

    this.posCatalogo.obtenerRangosProducto(producto.idProducto).subscribe({
      next: (rangos) => {
        this.rangosResueltos.add(producto.idProducto);
        this.catalogo.update((lista) =>
          lista.map((p) =>
            p.idProducto === producto.idProducto ? new ProductoVentaModel({ ...p, rangos }) : p,
          ),
        );
        const actualizado = this.catalogo().find((p) => p.idProducto === producto.idProducto) ?? producto;
        this.completarAgregado(actualizado, cantidad);
      },
      error: (err) => {
        // No bloquea la venta: sin rangos propios, recalcularTicket() usa el umbral genérico
        // de mayoreo (precioIndividual/precioMenudeo según cantidad total >= 6).
        console.error('Error al consultar precios por volumen del producto', err);
        this.rangosResueltos.add(producto.idProducto); // evita reintentos en cada escaneo
        this.completarAgregado(producto, cantidad);
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
    this.focusScan();
  }

  importeLinea(linea: LineaTicket): number {
    return this.round2(linea.cantidad * linea.precioUnitario);
  }

  descuentoLinea(linea: LineaTicket): number {
    return this.round2((linea.precioBase - linea.precioUnitario) * linea.cantidad);
  }

  existenciaLabel(p: ProductoVenta): string {
    return String(p.existencia);
  }

  /**
   * Réplica de `actualizaTicketVenta()`: recalcula el precio unitario de CADA línea evaluando
   * primero el rango de precio propio del producto (si su cantidad cae dentro) y, si no aplica
   * ninguno, el default de mayoreo cuando la cantidad TOTAL del ticket (todas las líneas) es
   * >= 6 artículos.
   */
  private recalcularTicket(): void {
    const catalogo = this.catalogo();
    const cantidadTotalTicket = this.ticket().reduce((acc, l) => acc + l.cantidad, 0);

    const actualizadas = this.ticket().map((linea) => {
      const producto = catalogo.find((p) => p.idProducto === linea.idProducto);
      if (!producto) return linea;

      let precioUnitario =
        cantidadTotalTicket >= 6 ? producto.precioMenudeo : producto.precioIndividual;

      const rangoAplicable = producto.rangos.find(
        (r) => linea.cantidad >= r.min && linea.cantidad <= r.max,
      );

      if (rangoAplicable) {
        precioUnitario = rangoAplicable.costo;
      } else if (producto.rangos.length > 0 && linea.cantidad > 6) {
        // Caso "excede el rango máximo definido": usa el costo del rango de mayor `max`.
        const rangoMax = producto.rangos.reduce((max, r) => (r.max > max.max ? r : max));
        if (linea.cantidad > rangoMax.max) {
          precioUnitario = rangoMax.costo;
        }
      }

      return new LineaTicketModel({ ...linea, precioUnitario });
    });

    this.ticket.set(actualizadas);
  }

  // ====================== Cobro ======================

  abrirCobro(): void {
    if (this.ticket().length === 0) {
      this.notify.notify('warning', this.translate.instant('ventas.pos.msg.ticketVacio'));
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

  /** POST /ventas real. Bloquea doble-submit con `guardandoVenta` + `blockUI` (regla 04). */
  private guardarVenta(datos: DatosCobro): void {
    if (this.guardandoVenta()) return;

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

    const request = new GuardarVentaRequestModel({
      detalles,
      idCliente: datos.idCliente,
      formaPago: datos.idFormaPago,
      usoCfdi: datos.idUsoCFDI ?? 0,
      idVenta: 0,
      aplicaIva: datos.facturar,
      numClientesAtendidos: datos.numClientesAtendidos ?? 0,
      tipoVenta: TipoVentaId.Normal,
      motivoDevolucion: null,
      idPedidoEspecial: 0,
      idVentaComplemento: 0,
      montoTotalVenta: datos.total,
      montoPagado: datos.efectivoRecibido,
    });

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
        next: (res) => {
          if (res?.estatus === 200) {
            this.ultimoCambio.set(datos.cambio);
            this.notify.notify(
              'success',
              res.mensaje || this.translate.instant('ventas.pos.msg.ventaRealizada'),
            );
            this.ticket.set([]);
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

  private round2(n: number): number {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }
}
