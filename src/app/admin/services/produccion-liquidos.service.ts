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
  CargaMercanciaLiquidos,
  CargaMercanciaLiquidosModel,
} from 'src/app/admin/models/produccion-liquidos/carga-mercancia-liquidos';

/**
 * Servicio HTTP del reporte "Producción Líquidos" (carga de mercancía). Solo lectura:
 * migra ConsultarLiquidos/BuscarCargaMercanciaLiquidos del legado. Sin `q` de texto libre
 * (filtros estructurados: idRol, idUsuario, fechaIni, fechaFin). Los catálogos de rol/usuario
 * se reusan de `UsuariosService` (regla 00) — este servicio no expone catálogos propios.
 */
@Injectable({ providedIn: 'root' })
export class ProduccionLiquidosService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.PRODUCCION_LIQUIDOS}`;

  /** Listado paginado. Filtros extra: idRol, idUsuario, fechaIni, fechaFin. */
  listar(opts: ListarParams = {}): Observable<PagedResult<CargaMercanciaLiquidos>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<CargaMercanciaLiquidos[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<CargaMercanciaLiquidos>> {
    return this.http
      .get<Notificacion<CargaMercanciaLiquidos[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  private mapPage(res: Notificacion<CargaMercanciaLiquidos[]>): PagedResult<CargaMercanciaLiquidos> {
    return {
      data: (res?.modelo ?? []).map((c) => new CargaMercanciaLiquidosModel(c)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
