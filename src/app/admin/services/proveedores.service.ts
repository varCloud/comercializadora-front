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
  Proveedor,
  ProveedorModel,
} from 'src/app/admin/models/proveedores/proveedor';
import { GuardarProveedorRequest } from 'src/app/admin/models/proveedores/guardar-proveedor-request';

/**
 * Servicio HTTP del módulo de Proveedores. Consume la API nueva (comercializadora-api).
 * Listado paginado estilo Laravel (data/links/meta); la navegación usa los links (irLink).
 */
@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.PROVEEDORES}`;

  /** Listado paginado (Notificacion con modelo/links/meta). `q` busca por nombre/descripción/teléfono/dirección. */
  listar(opts: ListarParams = {}): Observable<PagedResult<Proveedor>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<Proveedor[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last). */
  irLink(url: string): Observable<PagedResult<Proveedor>> {
    return this.http.get<Notificacion<Proveedor[]>>(url).pipe(map((res) => this.mapPage(res)));
  }

  /**
   * Búsqueda paginada para los selectores ng-select (app-select-paginado). Devuelve solo la
   * página de proveedores (sin links/meta); `q` busca por nombre/descripción/teléfono/dirección.
   */
  buscarPaginado(q: string, page = 1): Observable<Proveedor[]> {
    return this.listar({ q, page, perPage: 25 }).pipe(map((res) => res.data));
  }

  obtenerPorId(id: number): Observable<Proveedor | null> {
    return this.http
      .get<Notificacion<Proveedor>>(`${this.baseUri}/${id}`)
      .pipe(map((res) => (res?.modelo ? new ProveedorModel(res.modelo) : null)));
  }

  crear(request: GuardarProveedorRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(this.baseUri, request);
  }

  actualizar(
    id: number,
    request: GuardarProveedorRequest,
  ): Observable<Notificacion<string>> {
    return this.http.put<Notificacion<string>>(`${this.baseUri}/${id}`, request);
  }

  cambiarEstatus(id: number, activo: boolean): Observable<Notificacion<string>> {
    return this.http.patch<Notificacion<string>>(
      `${this.baseUri}/${id}/estatus`,
      { activo },
    );
  }

  private mapPage(res: Notificacion<Proveedor[]>): PagedResult<Proveedor> {
    return {
      data: (res?.modelo ?? []).map((p) => new ProveedorModel(p)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
