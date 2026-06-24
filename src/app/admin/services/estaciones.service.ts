import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
import { Catalogo, CatalogoModel } from 'src/app/admin/models/shared/catalogo';
import {
  EMPTY_LINKS,
  EMPTY_META,
  PagedResult,
} from 'src/app/admin/models/shared/paged-result';
import {
  ListarParams,
  buildListParams,
} from 'src/app/admin/models/shared/listar-params';
import { Estacion, EstacionModel } from 'src/app/admin/models/estaciones/estacion';
import { GuardarEstacionRequest } from 'src/app/admin/models/estaciones/guardar-estacion-request';

/**
 * Servicio HTTP del módulo de Estaciones. Consume la API nueva (comercializadora-api).
 * El token JWT lo agrega auth.interceptor.ts automáticamente (regla 02). El listado es
 * paginado server-side (Notificacion con modelo/links/meta); la navegación usa los links.
 */
@Injectable({ providedIn: 'root' })
export class EstacionesService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.ESTACIONES}`;

  /** Listado paginado (Notificacion con modelo/links/meta). `q` busca por nombre/número/almacén. */
  listar(opts: ListarParams = {}): Observable<PagedResult<Estacion>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<Estacion[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link que devolvió la API). */
  irLink(url: string): Observable<PagedResult<Estacion>> {
    return this.http.get<Notificacion<Estacion[]>>(url).pipe(map((res) => this.mapPage(res)));
  }

  private mapPage(res: Notificacion<Estacion[]>): PagedResult<Estacion> {
    return {
      data: (res?.modelo ?? []).map((e) => new EstacionModel(e)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }

  /** Obtiene una estación por id (para precargar el formulario de edición). */
  obtenerPorId(id: number): Observable<Estacion | null> {
    return this.http
      .get<Notificacion<Estacion>>(`${this.baseUri}/${id}`)
      .pipe(map((res) => (res?.modelo ? new EstacionModel(res.modelo) : null)));
  }

  /** Alta de estación. */
  crear(request: GuardarEstacionRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(this.baseUri, request);
  }

  /** Edición de estación. */
  actualizar(
    id: number,
    request: GuardarEstacionRequest,
  ): Observable<Notificacion<string>> {
    return this.http.put<Notificacion<string>>(`${this.baseUri}/${id}`, request);
  }

  /** Activa/desactiva (borrado lógico). */
  cambiarEstatus(id: number, activo: boolean): Observable<Notificacion<string>> {
    return this.http.patch<Notificacion<string>>(
      `${this.baseUri}/${id}/estatus`,
      { activo },
    );
  }

  obtenerSucursales(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/catalogos/sucursales`);
  }

  /** Almacenes por sucursal. La API filtra por idTipoAlmacen = 3 (estaciones) por defecto. */
  obtenerAlmacenes(idSucursal: number): Observable<Catalogo[]> {
    const params = new HttpParams().set('idSucursal', idSucursal);
    return this.obtenerCatalogo(`${this.baseUri}/catalogos/almacenes`, params);
  }

  private obtenerCatalogo(uri: string, params?: HttpParams): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(uri, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CatalogoModel(c))));
  }
}
