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
  LineaProducto,
  LineaProductoModel,
} from 'src/app/admin/models/productos/linea-producto';
import { GuardarLineaProductoRequest } from 'src/app/admin/models/productos/guardar-linea-producto-request';

/**
 * Servicio HTTP del submenú "Líneas de producto". Consume la API nueva (comercializadora-api).
 * Listado paginado (Notificacion con modelo/links/meta); navegación por links (irLink).
 */
@Injectable({ providedIn: 'root' })
export class LineasProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.LINEAS_PRODUCTO}`;

  /** Listado paginado. `q` busca por descripción. */
  listar(opts: ListarParams = {}): Observable<PagedResult<LineaProducto>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<LineaProducto[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last). */
  irLink(url: string): Observable<PagedResult<LineaProducto>> {
    return this.http
      .get<Notificacion<LineaProducto[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  obtenerPorId(id: number): Observable<LineaProducto | null> {
    return this.http
      .get<Notificacion<LineaProducto>>(`${this.baseUri}/${id}`)
      .pipe(map((res) => (res?.modelo ? new LineaProductoModel(res.modelo) : null)));
  }

  crear(request: GuardarLineaProductoRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(this.baseUri, request);
  }

  actualizar(id: number, request: GuardarLineaProductoRequest): Observable<Notificacion<string>> {
    return this.http.put<Notificacion<string>>(`${this.baseUri}/${id}`, request);
  }

  cambiarEstatus(id: number, activo: boolean): Observable<Notificacion<string>> {
    return this.http.patch<Notificacion<string>>(`${this.baseUri}/${id}/estatus`, { activo });
  }

  private mapPage(res: Notificacion<LineaProducto[]>): PagedResult<LineaProducto> {
    return {
      data: (res?.modelo ?? []).map((l) => new LineaProductoModel(l)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
