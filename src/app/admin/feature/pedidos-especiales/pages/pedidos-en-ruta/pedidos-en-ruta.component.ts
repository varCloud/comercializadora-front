import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Observable, Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { EMPTY_LINKS } from 'src/app/admin/models/shared/paged-result';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { abrirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';
import { PedidoEnRuta } from 'src/app/admin/models/pedidos-especiales/pedido-en-ruta';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';

/**
 * Página "Pedidos en Ruta" (Bloque C, FE-C3) — réplica de `Views/PedidosEspecialesV2/
 * PedidosEnRuta.cshtml` + `_ObtenerPedidosEnRuta.cshtml` + `EvtConsultaPedidosEnRuta.js`.
 * Listado de pedidos especiales entregados al Encargado de Ruteo, pendientes de liquidar con el
 * cliente. Solo lectura (sin alta propia, ver HU) salvo la acción "Liquidar Pedido" del dropdown
 * de acciones del legado, que sí se replica (ver `liquidar()`).
 *
 * **Filtros del legado:** en el `.cshtml` el único filtro visible es "Usuario" (`idUsuarioRuteo`)
 * — el rango de fechas está comentado en el código fuente ("COMENTADO A PETICION DE LLUVIA
 * OCTUBRE DEL 2022"), así que no se replica aquí. Se agrega buscador de texto libre (regla 13).
 *
 * Endpoint real: `GET /api/pedidos-especiales/en-ruta` (`idUsuarioRuteo`/`fechaIni`/`fechaFin`
 * opcionales), réplica de `_ObtenerPedidosEnRuta`/`SP_CONSULTA_PEDIDOS_EN_RUTA_V2` (Bloque C, API
 * ya migrada y revisada 🟢). El SP no pagina server-side — se aplica el mismo criterio de "último
 * recurso" que ya usó el Bloque B (`EntregarPedidoComponent`): paginación + filtro Usuario/texto
 * en cliente sobre el resultado completo (regla 10), documentado como deuda técnica para el
 * revisor.
 */
@Component({
  selector: 'app-pedidos-en-ruta',
  standalone: true,
  imports: [
    MaterialModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    PaginadorComponent,
    SelectPaginadoComponent,
    DatePipe,
    CurrencyPipe,
  ],
  templateUrl: './pedidos-en-ruta.component.html',
  styleUrl: './pedidos-en-ruta.component.scss',
})
export class PedidosEnRutaComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly pedidosEspecialesService = inject(PedidosEspecialesService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('pedidos-en-ruta') blockUI!: NgBlockUI;

  readonly displayedColumns = ['idPedidoEspecial', 'nombreCliente', 'montoTotal', 'cantidad', 'nombreUsuario', 'fechaAlta', 'action'];

  /** Estado de paginación (en cliente, ver TODO de clase). */
  readonly pag = new Paginador<PedidoEnRuta>(CONSTANTS.PAGINATION.PAGE_SIZE);
  /** Resultado completo devuelto por la API, antes de filtrar/paginar en cliente. */
  private pedidosCompletos: PedidoEnRuta[] = [];

  /** Filtro Usuario (réplica del `<select>` `idUsuarioRuteo` del legado). */
  readonly idUsuario = new FormControl<number | null>(null);

  private search = '';
  private readonly search$ = new Subject<string>();

  /** fetchPage del selector paginado de Usuario (regla 16) — reusa el catálogo ya migrado. */
  readonly fetchUsuarios = (q: string, page: number): Observable<unknown[]> =>
    this.usuariosService.buscarPaginado(q, page);

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((value) => {
        this.search = value;
        this.setLocalPage(1);
      });

    this.cargar();
  }

  /** Filtra en cliente por Usuario/texto libre (ver TODO de clase: endpoint aún no confirma filtros server-side). */
  private get filtrados(): PedidoEnRuta[] {
    const idUsuario = this.idUsuario.value;
    const q = this.search.trim().toLowerCase();

    return this.pedidosCompletos.filter((p) => {
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

  /** `GET /pedidos-especiales/en-ruta` (SP_CONSULTA_PEDIDOS_EN_RUTA_V2). */
  private cargarPedidosEnRuta(): Observable<PedidoEnRuta[]> {
    return this.pedidosEspecialesService.obtenerEnRuta();
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('pedidosEspeciales.pedidosEnRuta.msg.cargandoListado'));
    this.cargarPedidosEnRuta()
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (lista) => {
          this.pedidosCompletos = lista;
          this.setLocalPage(1);
        },
        error: (err) => {
          console.error('Error al consultar los pedidos en ruta', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.pedidosEnRuta.msg.errorListado'));
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

  /** Botón "Buscar": vuelve a consultar la API (por si el filtro Usuario pasa a ser server-side). */
  buscar(): void {
    this.setLocalPage(1);
  }

  /** Botón "Limpiar": resetea filtros y vuelve a consultar. */
  limpiarFiltros(): void {
    this.idUsuario.reset();
    this.search = '';
    this.cargar();
  }

  /**
   * Réplica de la acción "Liquidar Pedido" del dropdown del legado: navega a "Confirmar
   * Productos" con `esPedidoEnRuta = true` como query param (`Url.Action("ConfirmarProductos",
   * ..., new { idPedidoEspecial, esPedidoEnRuta = true, idCliente })`).
   * `ConfirmarProductosComponent` lee este query param y lo propaga al `GuardarConfirmacionRequest`
   * real (ver corrección de integración FE-C6 en ese componente).
   */
  liquidar(pedido: PedidoEnRuta): void {
    this.router.navigate(['/admin/pedidos-especiales/confirmar-productos', pedido.idPedidoEspecial], {
      queryParams: { idCliente: pedido.idCliente, esPedidoEnRuta: true },
    });
  }

  /** PDF del ticket de almacén (reusa `obtenerTicketAlmacen`, ya migrado en el Bloque B). */
  verTicket(pedido: PedidoEnRuta): void {
    this.pedidosEspecialesService.obtenerTicketAlmacen(pedido.idPedidoEspecial).subscribe({
      next: (blob) => abrirPdfBlob(blob),
      error: (err) => {
        console.error('Error al generar el ticket de almacén del pedido especial', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.pedidosEnRuta.msg.ticketError'));
      },
    });
  }
}
