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
import { ProductoVenta } from 'src/app/admin/models/ventas/producto-venta';
import { LineaTicket, LineaTicketModel } from 'src/app/admin/models/ventas/linea-ticket';
import { DatosCobro } from 'src/app/admin/models/ventas/datos-cobro';
import { PosCatalogoMockService } from '../../services/pos-catalogo-mock.service';
import {
  CobroDialogComponent,
  CobroDialogData,
} from '../../components/cobro-dialog/cobro-dialog.component';

/**
 * Pantalla POS — venta (FE-A3). Réplica de `Views/Ventas/Ventas.cshtml` + `EvtVentas.js`:
 * carga completa del catálogo de productos al entrar (`arrayProductos`), input de escaneo por
 * código de barras (Enter = búsqueda local + alta automática con cantidad 1), ticket editable
 * (alta/edición de cantidad, eliminar línea, recálculo en vivo del precio unitario) y descuento
 * por volumen evaluado por cantidad TOTAL del producto en el ticket (no por línea aislada).
 *
 * ⚠️ Catálogo SIMULADO (`PosCatalogoMockService`) — la API de Ventas todavía no existe.
 * FE-A5 reemplaza esto por el servicio HTTP real e integra `GuardarVenta`.
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
  private readonly catalogoMock = inject(PosCatalogoMockService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('pos') blockUI!: NgBlockUI;

  @ViewChild('scanInput') private readonly scanInputRef!: ElementRef<HTMLInputElement>;

  readonly catalogo = signal<ProductoVenta[]>([]);
  readonly ticket = signal<LineaTicket[]>([]);
  /** Persiste en pantalla después de cerrar el modal de cobro ("Último Cambio" del legado). */
  readonly ultimoCambio = signal<number | null>(null);

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
    this.catalogoMock
      .obtenerCatalogoProductos()
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (productos) => this.catalogo.set(productos),
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

    this.agregarProducto(producto, 1);
    this.scanControl.setValue('');
    this.focusScan();
  }

  private focusScan(): void {
    setTimeout(() => this.scanInputRef?.nativeElement?.focus());
  }

  // ====================== Ticket ======================

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
          cantidad: cantidadFinal,
          precioBase: producto.precioIndividual,
          precioUnitario: producto.precioIndividual,
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
        const datos = res.data as DatosCobro;
        this.ultimoCambio.set(datos.cambio);
        this.notify.notify('success', this.translate.instant('ventas.pos.msg.ventaRealizada'));
        // Simulación local (sin API todavía): limpia el ticket como si la venta se hubiera
        // guardado. FE-A5 reemplaza esto por el POST real a GuardarVenta + refresco de
        // existencias del catálogo.
        this.ticket.set([]);
      }
      this.focusScan();
    });
  }

  private round2(n: number): number {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }
}
