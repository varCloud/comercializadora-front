import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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
import { Cotizacion } from 'src/app/admin/models/pedidos-especiales/cotizacion';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';

/**
 * Página "Cotizaciones" (Bloque C, FE-C4) — réplica de `Views/PedidosEspecialesV2/
 * Cotizaciones.cshtml` + `evtCotizaciones.js`.
 *
 * **"Editar cotización" (P-07):** columna de acción que navega a "Nuevo Pedido"
 * (`/admin/pedidos-especiales/nuevo`) con `idPedidoEspecial`/`idCliente`/`idEstatusPedidoEspecial`
 * en el querystring — réplica de `Url.Action("PedidosEspeciales", "PedidosEspecialesV2", new {
 * idPedidoEspecial, idCliente, idEstatusPedidoEspecial })` (`Cotizaciones.cshtml:57,70`).
 * `NuevoPedidoComponent` precarga los productos de la cotización y reusa el mismo folio al
 * guardar (ver su documentación de clase).
 *
 * El legado NO tiene formulario de filtros para esta pantalla (`ObtenerCotizaciones()` no recibe
 * parámetros); se agrega buscador de texto libre en cliente (regla 13).
 *
 * Endpoint real: `GET /api/pedidos-especiales/cotizaciones` (sin parámetros), réplica de
 * `ObtenerCotizaciones`/`SP_OBTENER_COTIZACIONES_PEDIDOS_ESPECIALES` (Bloque C, API ya migrada
 * y revisada 🟢). El SP no pagina server-side — se aplica el mismo criterio de "último recurso"
 * que ya usó el Bloque B (regla 10), documentado como deuda técnica para el revisor.
 */
@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, BlockUIModule, TranslatePipe, PaginadorComponent, DatePipe, CurrencyPipe],
  templateUrl: './cotizaciones.component.html',
  styleUrl: './cotizaciones.component.scss',
})
export class CotizacionesComponent implements OnInit {
  private readonly pedidosEspecialesService = inject(PedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  @BlockUI('cotizaciones') blockUI!: NgBlockUI;

  readonly displayedColumns = ['idPedidoEspecial', 'fechaAlta', 'nombreCliente', 'cantidad', 'montoTotal', 'action'];

  /** Estado de paginación (en cliente, ver TODO de clase). */
  readonly pag = new Paginador<Cotizacion>(CONSTANTS.PAGINATION.PAGE_SIZE);
  /** Resultado completo devuelto por la API, antes de filtrar/paginar en cliente. */
  private cotizacionesCompletas: Cotizacion[] = [];

  private search = '';
  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((value) => {
        this.search = value;
        this.setLocalPage(1);
      });

    this.cargar();
  }

  /** Filtra en cliente por texto libre (el legado no tiene filtro server-side, ver TODO de clase). */
  private get filtradas(): Cotizacion[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.cotizacionesCompletas;

    return this.cotizacionesCompletas.filter(
      (c) => String(c.idPedidoEspecial).includes(q) || (c.nombreCliente ?? '').toLowerCase().includes(q),
    );
  }

  /** `GET /pedidos-especiales/cotizaciones` (SP_OBTENER_COTIZACIONES_PEDIDOS_ESPECIALES). */
  private cargarCotizaciones(): Observable<Cotizacion[]> {
    return this.pedidosEspecialesService.obtenerCotizaciones();
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('pedidosEspeciales.cotizaciones.msg.cargandoListado'));
    this.cargarCotizaciones()
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (lista) => {
          this.cotizacionesCompletas = lista;
          this.setLocalPage(1);
        },
        error: (err) => {
          console.error('Error al consultar las cotizaciones', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.cotizaciones.msg.errorListado'));
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

  /** Corta la página `pagina` de `filtradas` y sintetiza links/meta del paginador (regla 10, último recurso). */
  private setLocalPage(pagina: number): void {
    const lista = this.filtradas;
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

  /** "Editar cotización" (P-07) — réplica del link de `Cotizaciones.cshtml:57,70`. */
  editarCotizacion(cotizacion: Cotizacion): void {
    this.router.navigate(['/admin/pedidos-especiales/nuevo'], {
      queryParams: {
        idPedidoEspecial: cotizacion.idPedidoEspecial,
        idCliente: cotizacion.idCliente,
        idEstatusPedidoEspecial: cotizacion.idEstatusPedidoEspecial,
      },
    });
  }
}
