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
import { Usuario, UsuarioModel } from 'src/app/admin/models/usuarios/usuario';
import { GuardarUsuarioRequest } from 'src/app/admin/models/usuarios/guardar-usuario-request';

/**
 * Servicio HTTP del módulo de Usuarios. Consume la API nueva (comercializadora-api).
 * El token JWT lo agrega auth.interceptor.ts automáticamente (regla 02).
 */
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.USUARIOS}`;

  /** Listado paginado (Notificacion con modelo/links/meta). `q` busca por nombre/apellidos/usuario. */
  listar(opts: ListarParams = {}): Observable<PagedResult<Usuario>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<Usuario[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<Usuario>> {
    return this.http.get<Notificacion<Usuario[]>>(url).pipe(map((res) => this.mapPage(res)));
  }

  /**
   * Búsqueda paginada para los selectores ng-select (app-select-paginado). Devuelve solo la
   * página de usuarios (sin links/meta); `q` busca por nombre/apellidos/usuario.
   */
  buscarPaginado(q: string, page = 1): Observable<Usuario[]> {
    return this.listar({ q, page, perPage: 25 }).pipe(map((res) => res.data));
  }

  private mapPage(res: Notificacion<Usuario[]>): PagedResult<Usuario> {
    return {
      data: (res?.modelo ?? []).map((u) => new UsuarioModel(u)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }

  /** Obtiene un usuario por id (para precargar el formulario de edición). */
  obtenerPorId(id: number): Observable<Usuario | null> {
    return this.http
      .get<Notificacion<Usuario>>(`${this.baseUri}/${id}`)
      .pipe(map((res) => (res?.modelo ? new UsuarioModel(res.modelo) : null)));
  }

  /** Alta de usuario. Devuelve la Notificacion para mostrar estatus/mensaje. */
  crear(request: GuardarUsuarioRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(this.baseUri, request);
  }

  /** Edición de usuario. */
  actualizar(
    id: number,
    request: GuardarUsuarioRequest,
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

  obtenerRoles(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/catalogos/roles`);
  }

  obtenerSucursales(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/catalogos/sucursales`);
  }

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
