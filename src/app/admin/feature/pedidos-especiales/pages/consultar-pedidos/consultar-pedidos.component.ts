import { CurrencyPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL } from 'src/app/models/result-modal';
import { EMPTY_LINKS } from 'src/app/admin/models/shared/paged-result';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { abrirPdfBlob, imprimirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';
import { PrintAgentService } from 'src/app/admin/services/print-agent.service';
import { PedidoEspecialHistorico } from 'src/app/admin/models/pedidos-especiales/pedido-especial-historico';
import { RealizarDevolucionRequestModel } from 'src/app/admin/models/pedidos-especiales/realizar-devolucion-request';
import { ProductoDevueltoRequestModel } from 'src/app/admin/models/pedidos-especiales/producto-devuelto-request';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';
import {
  PedidoEspecialDetalleDialogComponent,
  PedidoEspecialDetalleData,
} from '../../components/pedido-especial-detalle-dialog/pedido-especial-detalle-dialog.component';
import {
  RegistrarDevolucionDialogComponent,
  RegistrarDevolucionData,
} from '../../components/registrar-devolucion-dialog/registrar-devolucion-dialog.component';
import {
  TicketsPedidoEspecialDialogComponent,
  TicketsPedidoEspecialData,
} from '../../components/tickets-pedido-especial-dialog/tickets-pedido-especial-dialog.component';
import {
  FacturarPedidoEspecialDialogComponent,
  FacturarPedidoEspecialDialogData,
} from '../../components/facturar-pedido-especial-dialog/facturar-pedido-especial-dialog.component';

/**
 * Página "Consultar Pedidos" (Bloque D, FE-D3/FE-D6) — réplica de `Views/PedidosEspecialesV2/
 * ConsultarPedidosEspeciales.cshtml` + `EvtConsultaPedidosEspecialesV2.js`. Cierra el submenú del
 * núcleo de Pedidos Especiales: búsqueda histórica + detalle (con bitácora) + devolución.
 *
 * **Filtros server-side reales** (`GET /pedidos-especiales/buscar`): a diferencia de Bloques
 * B/C, este endpoint SÍ acepta los 6 filtros del legado (`idCliente`, `idUsuario`,
 * `idEstatusPedidoEspecial`, `fechaIni`, `fechaFin`, `codigoBarras`) — no es "último recurso".
 * El SP no pagina, así que la paginación se aplica en cliente sobre el resultado ya filtrado
 * (mismo patrón `Paginador<T>` que Bloques B/C). Se agrega además un buscador de texto libre
 * (regla 13) que filtra en cliente sobre folio/cliente/usuario/observaciones, ya que el endpoint
 * real no tiene un parámetro `search` genérico.
 *
 * **Catálogos Cliente/Usuario/Estatus** (`/clientes`, `/usuarios`, `/estatus`): el SP no pagina
 * ni recibe parámetros (regresa el conjunto ya acotado de quienes tienen algún pedido especial),
 * así que se cargan completos en `ng-select` — no aplica el umbral de `app-select-paginado` de
 * la regla 16 porque el backend no lo soporta (desviación documentada en el task doc Bloque D).
 */
@Component({
  selector: 'app-consultar-pedidos',
  standalone: true,
  imports: [
    MaterialModule,
    MatNativeDateModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    NgSelectModule,
    PaginadorComponent,
    CurrencyPipe,
  ],
  templateUrl: './consultar-pedidos.component.html',
  styleUrl: './consultar-pedidos.component.scss',
})
export class ConsultarPedidosComponent implements OnInit {
  private readonly pedidosEspecialesService = inject(PedidosEspecialesService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly printAgent = inject(PrintAgentService);

  @BlockUI('consultar-pedidos') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'idPedidoEspecial',
    'fechaAlta',
    'nombreCliente',
    'nombreUsuario',
    'cantidad',
    'montoTotal',
    'estatusPedidoEspecial',
    'facturado',
    'liquidado',
    'codigoBarras',
    'observaciones',
    'action',
  ];

  readonly pag = new Paginador<PedidoEspecialHistorico>(CONSTANTS.PAGINATION.PAGE_SIZE);
  /** Resultado ya filtrado server-side (los 6 filtros reales), antes del buscador libre en cliente. */
  private pedidosFiltrados: PedidoEspecialHistorico[] = [];

  readonly clientes = signal<Catalogo[]>([]);
  readonly usuarios = signal<Catalogo[]>([]);
  readonly estatus = signal<Catalogo[]>([]);

  // Filtros (réplica del formulario "Buscar pedidos especiales" del legado).
  readonly idCliente = new FormControl<number | null>(null);
  readonly idUsuario = new FormControl<number | null>(null);
  readonly idEstatusPedidoEspecial = new FormControl<number | null>(null);
  readonly codigoBarras = new FormControl<string | null>(null);
  readonly hoy = new Date();
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  private search = '';
  private readonly search$ = new Subject<string>();

  /** Color por estatus (réplica exacta del `switch` de badges en `onSuccessPedidosEspeciales`). */
  private readonly estatusColores: Record<number, string> = {
    1: '#7b8893', // Solicitado
    2: '#ffae1f', // Cotizado
    3: '#5d87ff', // En resguardo
    4: '#13deb9', // Entregado y pagado
    5: '#1e88e5', // Entregado a repartidor sin pagar
    6: '#13deb9', // Pagado
    7: '#e53935', // A crédito
  };

  ngOnInit(): void {
    this.pedidosEspecialesService.obtenerClientesCatalogo().subscribe({
      next: (clientes) => this.clientes.set(clientes),
      error: (err) => console.error('Error al cargar el catálogo de clientes de Pedidos Especiales', err),
    });
    this.pedidosEspecialesService.obtenerUsuariosCatalogo().subscribe({
      next: (usuarios) => this.usuarios.set(usuarios),
      error: (err) => console.error('Error al cargar el catálogo de usuarios de Pedidos Especiales', err),
    });
    this.pedidosEspecialesService.obtenerEstatusCatalogo().subscribe({
      next: (estatus) => this.estatus.set(estatus),
      error: (err) => console.error('Error al cargar el catálogo de estatus de Pedidos Especiales', err),
    });

    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((value) => {
        this.search = value;
        this.setLocalPage(1);
      });

    this.cargar();
  }

  estatusColor(idEstatusPedidoEspecial: number): string {
    return this.estatusColores[idEstatusPedidoEspecial] ?? '#7b8893';
  }

  private get filtros(): {
    fechaIni: string | null;
    fechaFin: string | null;
  } {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
    };
  }

  /** Filtra en cliente solo por el buscador de texto libre (regla 13; los 6 filtros reales ya son server-side). */
  private get filtrados(): PedidoEspecialHistorico[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.pedidosFiltrados;

    return this.pedidosFiltrados.filter(
      (p) =>
        String(p.idPedidoEspecial).includes(q) ||
        (p.nombreCliente ?? '').toLowerCase().includes(q) ||
        (p.nombreUsuario ?? '').toLowerCase().includes(q) ||
        (p.observaciones ?? '').toLowerCase().includes(q),
    );
  }

  cargar(): void {
    const { fechaIni, fechaFin } = this.filtros;
    this.blockUI.start(this.translate.instant('pedidosEspeciales.consultarPedidos.msg.cargandoListado'));
    this.pedidosEspecialesService
      .buscar(
        this.idCliente.value ?? 0,
        this.idUsuario.value ?? 0,
        this.idEstatusPedidoEspecial.value ?? 0,
        fechaIni,
        fechaFin,
        this.codigoBarras.value,
      )
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (lista) => {
          this.pedidosFiltrados = lista;
          this.setLocalPage(1);
        },
        error: (err) => {
          console.error('Error al consultar los pedidos especiales', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.consultarPedidos.msg.errorListado'));
        },
      });
  }

  navegar(pagina: string): void {
    this.setLocalPage(parseInt(pagina, 10) || 1);
  }

  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.setLocalPage(1);
  }

  /** Corta la página `pagina` de `filtrados` y sintetiza links/meta del paginador (regla 10, último recurso: el SP no pagina). */
  private setLocalPage(pagina: number): void {
    const lista = this.filtrados;
    const perPage = this.pag.perPage();
    const total = lista.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(1, pagina), lastPage);
    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);

    this.pag.setPage({
      data: lista.slice(from - 1, to),
      links: {
        ...EMPTY_LINKS,
        first: page > 1 ? '1' : null,
        prev: page > 1 ? String(page - 1) : null,
        next: page < lastPage ? String(page + 1) : null,
        last: page < lastPage ? String(lastPage) : null,
      },
      meta: { currentPage: page, from, lastPage, path: '', perPage, to, total },
    });
  }

  applyFilter(value: string): void {
    this.search$.next(value);
  }

  buscar(): void {
    this.cargar();
  }

  limpiarFiltros(): void {
    this.idCliente.reset();
    this.idUsuario.reset();
    this.idEstatusPedidoEspecial.reset();
    this.codigoBarras.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.search = '';
    this.cargar();
  }

  /** "Ver Detalle" (siempre disponible) — abre el diálogo con datos + productos + bitácora + devolución. */
  verDetalle(pedido: PedidoEspecialHistorico): void {
    const ref = this.dialog.open<PedidoEspecialDetalleDialogComponent, PedidoEspecialDetalleData>(
      PedidoEspecialDetalleDialogComponent,
      {
        data: { pedido },
        width: '1100px',
        maxWidth: '95vw',
      },
    );

    ref.afterClosed().subscribe((res) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) this.cargar();
    });
  }

  /**
   * "Ticket Original" (P-06, solo estatus Pagado=6 / A crédito=7) — réplica de
   * `ImprimeTicket(id, 1, 0)` (`EvtConsultaPedidosEspecialesV2.js:119-124`). Misma acción de
   * impresión directa que "Ticket Productos" de Entregar Pedido (P-05): ticket de cliente
   * (`obtenerTicket`) enviado vía `PrintAgentService`, ya no bloqueada por GDI físico (ver
   * memoria `agente-impresion-pos-print-agent`).
   */
  ticketOriginal(pedido: PedidoEspecialHistorico): void {
    this.pedidosEspecialesService.obtenerTicket(pedido.idPedidoEspecial).subscribe({
      next: (blob) => imprimirPdfBlob(blob, this.printAgent),
      error: (err) => {
        console.error('Error al generar el ticket original del pedido especial', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.consultarPedidos.msg.ticketError'));
      },
    });
  }

  /**
   * "Imprimir Ticket Almacén" (P-08) — réplica de `imprimirTicketAlmacenes(id)`
   * (`EvtConsultaPedidosEspecialesV2.js:125`): impresión directa, acción separada de "Ver Ticket
   * Almacén" (que abre el PDF). Restaura la paridad 1:1 que se había fusionado en una sola acción.
   */
  imprimirTicketAlmacen(pedido: PedidoEspecialHistorico): void {
    this.pedidosEspecialesService.obtenerTicketAlmacen(pedido.idPedidoEspecial).subscribe({
      next: (blob) => imprimirPdfBlob(blob, this.printAgent),
      error: (err) => {
        console.error('Error al generar el ticket de almacén del pedido especial', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.consultarPedidos.msg.ticketError'));
      },
    });
  }

  /** "Ver Ticket Almacén" (siempre disponible, reusa el PDF ya migrado en Bloque B). */
  verTicketAlmacen(pedido: PedidoEspecialHistorico): void {
    this.pedidosEspecialesService.obtenerTicketAlmacen(pedido.idPedidoEspecial).subscribe({
      next: (blob) => abrirPdfBlob(blob),
      error: (err) => {
        console.error('Error al generar el ticket de almacén del pedido especial', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.consultarPedidos.msg.ticketError'));
      },
    });
  }

  /** "Tickets" (solo si `existeTicket`) — réplica de la acción `Tickets` del dropdown legado. */
  verTickets(pedido: PedidoEspecialHistorico): void {
    this.dialog.open<TicketsPedidoEspecialDialogComponent, TicketsPedidoEspecialData>(
      TicketsPedidoEspecialDialogComponent,
      {
        data: { folio: pedido.idPedidoEspecial },
        width: '700px',
        maxWidth: '95vw',
      },
    );
  }

  /** "Facturar" (solo si `puedeFacturar`, P-02) — réplica de `modalFacturar()`/`#ModalFacturar`. */
  facturar(pedido: PedidoEspecialHistorico): void {
    const ref = this.dialog.open<FacturarPedidoEspecialDialogComponent, FacturarPedidoEspecialDialogData>(
      FacturarPedidoEspecialDialogComponent,
      {
        data: { folio: pedido.idPedidoEspecial, montoTotal: pedido.montoTotal },
        width: '900px',
        maxWidth: '95vw',
        disableClose: true,
      },
    );

    ref.afterClosed().subscribe((res) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) this.cargar();
    });
  }

  /** "Registrar Devolución" (solo si `puedeDevolver`) — atajo directo del dropdown, mismo diálogo que el detalle. */
  registrarDevolucion(pedido: PedidoEspecialHistorico): void {
    const ref = this.dialog.open<RegistrarDevolucionDialogComponent, RegistrarDevolucionData>(
      RegistrarDevolucionDialogComponent,
      {
        data: { folio: pedido.idPedidoEspecial },
        width: '1000px',
        maxWidth: '95vw',
        disableClose: true,
      },
    );

    ref.afterClosed().subscribe((res) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) this.cargar();
    });
  }

  /**
   * "Cancelar" (solo si `puedeDevolver`) — réplica de `Eliminar()`/`MostrarDetalleDevolucion(id,
   * true)`: confirma, devuelve el 100% de cada línea con motivo "Cancelado" y envía sin abrir el
   * formulario (igual que el legado, que auto-rellena las cantidades y dispara el submit).
   */
  cancelar(pedido: PedidoEspecialHistorico): void {
    Swal.fire({
      title: this.translate.instant('pedidosEspeciales.consultarPedidos.confirm.cancelarTitle'),
      text: this.translate.instant('pedidosEspeciales.consultarPedidos.confirm.cancelarText', {
        folio: pedido.idPedidoEspecial,
      }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('pedidosEspeciales.consultarPedidos.confirm.accept'),
      cancelButtonText: this.translate.instant('pedidosEspeciales.consultarPedidos.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.blockUI.start(this.translate.instant('pedidosEspeciales.consultarPedidos.msg.cancelando'));
      this.pedidosEspecialesService
        .obtenerDetalle(pedido.idPedidoEspecial)
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (productos) => {
            const lineas = productos.filter((p) => p.cantidad > 0);
            // Réplica exacta de `actualizarSubTotalDevoluciones()`: devolución completa de cada línea.
            const montoDevuelto = lineas.reduce((acc, p) => {
              const comision = p.cantidad > 0 ? (p.montoComisionBancaria ?? 0) : 0;
              return acc + p.cantidad * p.precioVenta + comision;
            }, 0);

            const request = new RealizarDevolucionRequestModel({
              productos: lineas.map(
                (p) =>
                  new ProductoDevueltoRequestModel({
                    idProducto: p.idProducto,
                    idPedidoEspecialDetalle: p.idPedidoEspecialDetalle,
                    productosDevueltos: p.cantidad,
                  }),
              ),
              montoDevuelto: Math.round((montoDevuelto + Number.EPSILON) * 100) / 100,
              motivoDevolucion: 'Cancelado',
            });

            this.pedidosEspecialesService.realizarDevolucion(pedido.idPedidoEspecial, request).subscribe({
              next: (res) => {
                if (res?.estatus === 200) {
                  this.notify.notify(
                    'success',
                    res.mensaje || this.translate.instant('pedidosEspeciales.consultarPedidos.msg.cancelarOk'),
                  );
                  this.cargar();
                } else {
                  this.notify.notify(
                    'error',
                    res?.mensaje ?? this.translate.instant('pedidosEspeciales.consultarPedidos.msg.cancelarFallback'),
                  );
                }
              },
              error: (err) => {
                console.error('Error al cancelar el pedido especial', err);
                this.notify.notify('error', this.translate.instant('pedidosEspeciales.consultarPedidos.msg.cancelarError'));
              },
            });
          },
          error: (err) => {
            console.error('Error al cargar el detalle del pedido especial para cancelar', err);
            this.notify.notify('error', this.translate.instant('pedidosEspeciales.consultarPedidos.msg.cancelarError'));
          },
        });
    });
  }
}
