import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
import {
  EMPTY_LINKS,
  EMPTY_META,
  PagedResult,
} from 'src/app/admin/models/shared/paged-result';
import {
  ListarParams,
  buildListParams,
} from 'src/app/admin/models/shared/listar-params';
import {
  CostoProduccionAgranelPorProducto,
  CostoProduccionAgranelPorProductoModel,
} from 'src/app/admin/models/consumo-mpl-individual/costo-produccion-agranel-por-producto';

/**
 * Servicio HTTP del reporte "MPL Individual" (detalle de costo de producción a granel por
 * producto). Migra `ProduccionAgranelController`/`MPLIndividual` (SP_V2_CONSULTA_COSTO_
 * PRODUCCION_POR_PRODUCTO), hermano de "MPL Agrupado" (`consumo-mpl.service.ts`) pero a nivel
 * de renglón individual (regla 02). El catálogo de Estatus NO se duplica aquí (regla 00): el
 * componente lo consume directo de `ProduccionAgranelService.obtenerEstatus()`.
 */
@Injectable({ providedIn: 'root' })
export class ConsumoMplIndividualService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.CONSUMO_MPL_INDIVIDUAL}`;

  /** Listado paginado. Filtros: fechaIni, fechaFin, idEstatusProduccionAgranel (0/ausente = TODOS), q. */
  listar(opts: ListarParams = {}): Observable<PagedResult<CostoProduccionAgranelPorProducto>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<CostoProduccionAgranelPorProducto[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<CostoProduccionAgranelPorProducto>> {
    return this.http
      .get<Notificacion<CostoProduccionAgranelPorProducto[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  private mapPage(
    res: Notificacion<CostoProduccionAgranelPorProducto[]>,
  ): PagedResult<CostoProduccionAgranelPorProducto> {
    return {
      data: (res?.modelo ?? []).map((c) => new CostoProduccionAgranelPorProductoModel(c)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
