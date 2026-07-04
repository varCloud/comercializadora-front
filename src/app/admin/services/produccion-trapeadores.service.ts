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
  CargaMercanciaTrapeadores,
  CargaMercanciaTrapeadoresModel,
} from 'src/app/admin/models/produccion-trapeadores/carga-mercancia-trapeadores';

/**
 * Servicio HTTP del reporte "Producción Trapeadores" (carga de mercancía). Hermano de
 * ProduccionLiquidosService: mismo contrato (Notificacion con modelo/links/meta), solo lectura,
 * sin `q` de texto libre (filtros estructurados: idRol, idUsuario, fechaIni, fechaFin). El
 * `idTipoMovInventario = 32` es fijo en el backend, no se expone aquí. Los catálogos de
 * rol/usuario se reusan de `UsuariosService` (regla 00) — este servicio no expone catálogos propios.
 */
@Injectable({ providedIn: 'root' })
export class ProduccionTrapeadoresService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.PRODUCCION_TRAPEADORES}`;

  /** Listado paginado. Filtros extra: idRol, idUsuario, fechaIni, fechaFin. */
  listar(opts: ListarParams = {}): Observable<PagedResult<CargaMercanciaTrapeadores>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<CargaMercanciaTrapeadores[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<CargaMercanciaTrapeadores>> {
    return this.http
      .get<Notificacion<CargaMercanciaTrapeadores[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  private mapPage(
    res: Notificacion<CargaMercanciaTrapeadores[]>,
  ): PagedResult<CargaMercanciaTrapeadores> {
    return {
      data: (res?.modelo ?? []).map((c) => new CargaMercanciaTrapeadoresModel(c)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
