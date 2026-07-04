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
  TipoCliente,
  TipoClienteModel,
} from 'src/app/admin/models/clientes/tipo-cliente';
import { GuardarTipoClienteRequest } from 'src/app/admin/models/clientes/guardar-tipo-cliente-request';

/**
 * Servicio HTTP del módulo de Tipos de cliente (pantalla "Descuentos" del legado).
 * Consume api/tipos-cliente. Listado paginado (modelo/links/meta); navegación por links.
 * Orden server-side whitelisteado: order=descripcion|descuento (default descripción asc).
 */
@Injectable({ providedIn: 'root' })
export class TiposClienteService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.TIPOS_CLIENTE}`;

  /** Listado paginado. `q` busca por descripción. */
  listar(opts: ListarParams = {}): Observable<PagedResult<TipoCliente>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<TipoCliente[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last). */
  irLink(url: string): Observable<PagedResult<TipoCliente>> {
    return this.http
      .get<Notificacion<TipoCliente[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Tipo por id (estatus 200 con modelo null si no existe o está dado de baja). */
  obtenerPorId(id: number): Observable<TipoCliente | null> {
    return this.http
      .get<Notificacion<TipoCliente>>(`${this.baseUri}/${id}`)
      .pipe(map((res) => (res?.modelo ? new TipoClienteModel(res.modelo) : null)));
  }

  crear(request: GuardarTipoClienteRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(this.baseUri, request);
  }

  actualizar(
    id: number,
    request: GuardarTipoClienteRequest,
  ): Observable<Notificacion<string>> {
    return this.http.put<Notificacion<string>>(`${this.baseUri}/${id}`, request);
  }

  /** Baja/alta lógica del tipo de cliente. */
  cambiarEstatus(id: number, activo: boolean): Observable<Notificacion<string>> {
    return this.http.patch<Notificacion<string>>(
      `${this.baseUri}/${id}/estatus`,
      { activo },
    );
  }

  private mapPage(res: Notificacion<TipoCliente[]>): PagedResult<TipoCliente> {
    return {
      data: (res?.modelo ?? []).map((t) => new TipoClienteModel(t)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
