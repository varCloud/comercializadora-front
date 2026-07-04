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
import { Cliente, ClienteModel } from 'src/app/admin/models/clientes/cliente';
import { GuardarClienteRequest } from 'src/app/admin/models/clientes/guardar-cliente-request';
import {
  TipoCliente,
  TipoClienteModel,
} from 'src/app/admin/models/clientes/tipo-cliente';
import {
  RegimenFiscal,
  RegimenFiscalModel,
} from 'src/app/admin/models/clientes/regimen-fiscal';

/**
 * Servicio HTTP del módulo de Clientes. Consume la API nueva (comercializadora-api).
 * Listado paginado estilo Laravel (modelo/links/meta); la navegación usa los links (irLink).
 * Orden server-side whitelisteado: order=nombre|rfc|municipio (fuera de whitelist cae al default).
 */
@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.CLIENTES}`;

  /** Listado paginado. `q` busca por nombre/razón social, RFC, teléfono, correo y municipio. */
  listar(opts: ListarParams = {}): Observable<PagedResult<Cliente>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<Cliente[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last). */
  irLink(url: string): Observable<PagedResult<Cliente>> {
    return this.http.get<Notificacion<Cliente[]>>(url).pipe(map((res) => this.mapPage(res)));
  }

  /**
   * Cliente por id. Un id inexistente o dado de baja responde estatus 200 con modelo null
   * (el SP filtra activo=1 también en by-id) → se devuelve null, no error.
   */
  obtenerPorId(id: number): Observable<Cliente | null> {
    return this.http
      .get<Notificacion<Cliente>>(`${this.baseUri}/${id}`)
      .pipe(map((res) => (res?.modelo ? new ClienteModel(res.modelo) : null)));
  }

  crear(request: GuardarClienteRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(this.baseUri, request);
  }

  actualizar(
    id: number,
    request: GuardarClienteRequest,
  ): Observable<Notificacion<string>> {
    return this.http.put<Notificacion<string>>(`${this.baseUri}/${id}`, request);
  }

  /** Baja/alta lógica (booleano real; bug @activo=nombres del legado corregido en la API). */
  cambiarEstatus(id: number, activo: boolean): Observable<Notificacion<string>> {
    return this.http.patch<Notificacion<string>>(
      `${this.baseUri}/${id}/estatus`,
      { activo },
    );
  }

  /** Tipos de cliente ACTIVOS para el dropdown del form (sin links/meta). */
  catalogoTipos(): Observable<TipoCliente[]> {
    return this.http
      .get<Notificacion<TipoCliente[]>>(`${this.baseUri}/catalogos/tipos`)
      .pipe(map((res) => (res?.modelo ?? []).map((t) => new TipoClienteModel(t))));
  }

  /** Catálogo read-only de regímenes fiscales del SAT (sin links/meta). */
  catalogoRegimenes(): Observable<RegimenFiscal[]> {
    return this.http
      .get<Notificacion<RegimenFiscal[]>>(`${this.baseUri}/catalogos/regimenes-fiscales`)
      .pipe(map((res) => (res?.modelo ?? []).map((r) => new RegimenFiscalModel(r))));
  }

  private mapPage(res: Notificacion<Cliente[]>): PagedResult<Cliente> {
    return {
      data: (res?.modelo ?? []).map((c) => new ClienteModel(c)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
