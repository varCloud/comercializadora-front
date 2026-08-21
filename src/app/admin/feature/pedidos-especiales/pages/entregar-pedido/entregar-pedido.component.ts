import { CurrencyPipe, DatePipe, formatDate } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Observable, Subject, debounceTime, distinctUntilChanged, finalize, map } from 'rxjs';
import Swal from 'sweetalert2';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { EMPTY_LINKS } from 'src/app/admin/models/shared/paged-result';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { abrirPdfBlob, imprimirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';
import { PedidoEspecialPendiente } from 'src/app/admin/models/pedidos-especiales/pedido-especial-pendiente';
import { ClientesService } from 'src/app/admin/services/clientes.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';
import { PrintAgentService } from 'src/app/admin/services/print-agent.service';

/**
 * Página "Entregar Pedido" (Bloque B, FE-B5) — réplica de `Views/PedidosEspecialesV2/
 * EntregarPedido.cshtml` + `_ObtenerEntregarPedidos.cshtml` (filtro Cliente/Usuario/rango de
 * fechas + tabla de pedidos especiales pendientes de entrega).
 *
 * **Contrato real** (`GET /pedidos-especiales/pendientes-entrega`): solo acepta
 * `idPedidoEspecial`/`fechaIni`/`fechaFin` como filtros y **no pagina server-side** (el SP
 * legado no pagina). El boceto original (FE-B3) asumía filtros de Cliente/Usuario + búsqueda de
 * texto libre server-side que el endpoint real no tiene — se resuelven en **cliente** sobre el
 * resultado ya traído por rango de fechas (mismo patrón que `RetirosIngresosComponent`/
 * `CajaService`, regla 10 "último recurso"): se trae la lista completa del rango de fechas
 * seleccionado y se filtra/pagina en memoria por Cliente/Usuario/texto. Si el volumen de pedidos
 * por rango de fechas crece mucho, valorar un `SP_V2_CONSULTA_PEDIDOS_ESPECIALES` con paginación
 * server-side real (@search/@pageNumber/@pageSize) en un incremento futuro — pendiente para el
 * revisor.
 */
@Component({
  selector: 'app-entregar-pedido',
  standalone: true,
  imports: [
    MaterialModule,
    MatNativeDateModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    PaginadorComponent,
    SelectPaginadoComponent,
    DatePipe,
    CurrencyPipe,
  ],
  templateUrl: './entregar-pedido.component.html',
  styleUrl: './entregar-pedido.component.scss',
})
export class EntregarPedidoComponent implements OnInit {
  private readonly clientesService = inject(ClientesService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly pedidosEspecialesService = inject(PedidosEspecialesService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly printAgent = inject(PrintAgentService);

  @BlockUI('entregar-pedido') blockUI!: NgBlockUI;

  readonly displayedColumns = ['idPedidoEspecial', 'nombreCliente', 'montoTotal', 'cantidad', 'nombreUsuario', 'fechaAlta', 'action'];

  /** Estado de paginación (en cliente, ver nota de clase). */
  readonly pag = new Paginador<PedidoEspecialPendiente>(CONSTANTS.PAGINATION.PAGE_SIZE);
  /** Resultado completo del rango de fechas consultado, antes de filtrar/paginar en cliente. */
  private pendientesCompletos: PedidoEspecialPendiente[] = [];

  // Filtros: Cliente + Usuario (réplica de los `<select>` del legado) + rango de fechas
  // (regla 18: default hoy/hoy, `hoy` siempre seleccionable) + buscador de texto libre (regla 13).
  readonly idCliente = new FormControl<number | null>(null);
  readonly idUsuario = new FormControl<number | null>(null);
  readonly hoy = new Date();
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  private search = '';
  private readonly search$ = new Subject<string>();

  /** fetchPage para los selectores paginados (regla 16) — reusan catálogos ya migrados. */
  readonly fetchClientes = (q: string, page: number): Observable<unknown[]> =>
    this.clientesService.listar({ q, page, perPage: 25 }).pipe(map((res) => res.data));
  readonly fetchUsuarios = (q: string, page: number): Observable<unknown[]> =>
    this.usuariosService.buscarPaginado(q, page);

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((value) => {
        this.search = value;
        // Búsqueda de texto libre en cliente (el endpoint real no tiene `search`, ver nota de
        // clase): no hace falta reconsultar la API, solo re-filtrar/paginar lo ya cargado.
        this.setLocalPage(1);
      });

    this.cargar();
  }

  private get fechas(): { fechaIni: string | null; fechaFin: string | null } {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
    };
  }

  /** Filtra en cliente por Cliente/Usuario/texto libre (el endpoint real no los soporta, ver nota de clase). */
  private get filtrados(): PedidoEspecialPendiente[] {
    const idCliente = this.idCliente.value;
    const idUsuario = this.idUsuario.value;
    const q = this.search.trim().toLowerCase();

    return this.pendientesCompletos.filter((p) => {
      if (idCliente && p.idCliente !== idCliente) return false;
      if (idUsuario && p.idUsuario !== idUsuario) return false;
      if (
        q &&
        !(
          String(p.idPedidoEspecial).includes(q) ||
          (p.nombreCliente ?? '').toLowerCase().includes(q) ||
          (p.nombreUsuario ?? '').toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      return true;
    });
  }

  /** Consulta la API por rango de fechas (único filtro server-side real) y repagina en cliente. */
  cargar(): void {
    const { fechaIni, fechaFin } = this.fechas;
    this.blockUI.start(this.translate.instant('pedidosEspeciales.entregarPedido.msg.cargandoListado'));
    this.pedidosEspecialesService
      .obtenerPendientesEntrega(0, fechaIni, fechaFin)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (lista) => {
          this.pendientesCompletos = lista;
          this.setLocalPage(1);
        },
        error: (err) => {
          console.error('Error al consultar los pedidos especiales pendientes de entrega', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.entregarPedido.msg.errorListado'));
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

  /** Corta la página `pagina` de `filtrados` y sintetiza links/meta del paginador (regla 10, último recurso). */
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

  /** Botón "Buscar": vuelve a consultar la API con el rango de fechas actual. */
  buscar(): void {
    this.cargar();
  }

  /** Botón "Limpiar": resetea filtros (rango de fechas vuelve a su default hoy/hoy, regla 18). */
  limpiarFiltros(): void {
    this.idCliente.reset();
    this.idUsuario.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.search = '';
    this.cargar();
  }

  /** Navega a "Confirmar Productos" (réplica de `Url.Action("ConfirmarProductos", ...)`). */
  entregar(pedido: PedidoEspecialPendiente): void {
    this.router.navigate(['/admin/pedidos-especiales/confirmar-productos', pedido.idPedidoEspecial], {
      queryParams: { idCliente: pedido.idCliente },
    });
  }

  /**
   * "Ticket Productos" (P-05) — réplica de `ImprimeTicketPedidoEspecial(id, 1, 0, false)`
   * (`_ObtenerEntregarPedidos.cshtml:67`): ticket de **cliente** (mismo PDF que `obtenerTicket`,
   * usado en "Nuevo Pedido"), distinto del PDF de almacén de `verTicket()`. En el legado es una
   * acción de **impresión directa** (toast "Se envió el ticket a la impresora"), no de vista
   * previa — se replica con `imprimirPdfBlob`/`PrintAgentService`, mismo patrón ya usado para el
   * ticket de almacén de "Nuevo Pedido".
   */
  ticketProductos(pedido: PedidoEspecialPendiente): void {
    this.pedidosEspecialesService.obtenerTicket(pedido.idPedidoEspecial).subscribe({
      next: (blob) => imprimirPdfBlob(blob, this.printAgent),
      error: (err) => {
        console.error('Error al generar el ticket del pedido especial', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.entregarPedido.msg.ticketError'));
      },
    });
  }

  /**
   * "Imprimir Ticket Almacenes" (P-08) — réplica de `imprimirTicketAlmacenes(id)`
   * (`_ObtenerEntregarPedidos.cshtml:68`): impresión directa, acción separada de "Ver Ticket"
   * (que abre el PDF). Restaura la paridad 1:1 que se había fusionado en una sola acción.
   */
  imprimirTicketAlmacen(pedido: PedidoEspecialPendiente): void {
    this.pedidosEspecialesService.obtenerTicketAlmacen(pedido.idPedidoEspecial).subscribe({
      next: (blob) => imprimirPdfBlob(blob, this.printAgent),
      error: (err) => {
        console.error('Error al generar el ticket de almacén del pedido especial', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.entregarPedido.msg.ticketError'));
      },
    });
  }

  /** PDF del ticket de almacén ("para despachadores"): una página por almacén destino del pedido. */
  verTicket(pedido: PedidoEspecialPendiente): void {
    this.pedidosEspecialesService.obtenerTicketAlmacen(pedido.idPedidoEspecial).subscribe({
      next: (blob) => abrirPdfBlob(blob),
      error: (err) => {
        console.error('Error al generar el ticket de almacén del pedido especial', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.entregarPedido.msg.ticketError'));
      },
    });
  }

  /** Cancela un pedido especial completo (réplica de `CancelarrPedidoEspecial`). */
  cancelar(pedido: PedidoEspecialPendiente): void {
    Swal.fire({
      title: this.translate.instant('pedidosEspeciales.entregarPedido.confirm.cancelarTitle'),
      text: this.translate.instant('pedidosEspeciales.entregarPedido.confirm.cancelarText', {
        folio: pedido.idPedidoEspecial,
      }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('pedidosEspeciales.entregarPedido.confirm.accept'),
      cancelButtonText: this.translate.instant('pedidosEspeciales.entregarPedido.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.blockUI.start(this.translate.instant('pedidosEspeciales.entregarPedido.msg.cancelando'));
      this.pedidosEspecialesService
        .cancelarPedido(pedido.idPedidoEspecial)
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje || this.translate.instant('pedidosEspeciales.entregarPedido.msg.cancelarOk'));
              this.cargar();
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('pedidosEspeciales.entregarPedido.msg.cancelarFallback'),
              );
            }
          },
          error: (err) => {
            console.error('Error al cancelar el pedido especial', err);
            this.notify.notify('error', this.translate.instant('pedidosEspeciales.entregarPedido.msg.cancelarError'));
          },
        });
    });
  }
}
