import { HttpClient } from '@angular/common/http';
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
import { Compra, CompraModel } from 'src/app/admin/models/compras/compra';
import {
  EstatusCompra,
  EstatusCompraModel,
} from 'src/app/admin/models/compras/estatus-compra';
import { GuardarCompraRequest } from 'src/app/admin/models/compras/guardar-compra-request';

/**
 * Servicio HTTP del módulo de Compras. Consume la API nueva (comercializadora-api).
 * Listado paginado (Notificacion con modelo/links/meta); la navegación usa los links (irLink).
 * Migra ComprasController/ComprasDAO + EvtConsultaCompras.js del legado.
 */
@Injectable({ providedIn: 'root' })
export class ComprasService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.COMPRAS}`;

  /**
   * Listado paginado. `q` busca por proveedor/observaciones/idCompra; filtros extra:
   * idProveedor, idStatusCompra, idUsuario, fechaInicio, fechaFin.
   */
  listar(opts: ListarParams = {}): Observable<PagedResult<Compra>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<Compra[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last). */
  irLink(url: string): Observable<PagedResult<Compra>> {
    return this.http.get<Notificacion<Compra[]>>(url).pipe(map((res) => this.mapPage(res)));
  }

  /** Compra por id: cabecera + detalle de productos (para precargar el modal de edición). */
  obtenerPorId(id: number): Observable<Compra | null> {
    return this.http
      .get<Notificacion<Compra>>(`${this.baseUri}/${id}`)
      .pipe(map((res) => (res?.modelo ? new CompraModel(res.modelo) : null)));
  }

  /** Alta de compra (ejecuta SP_REGISTRA_COMPRA con idCompra = 0). */
  crear(request: GuardarCompraRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(this.baseUri, request);
  }

  /** Edición de compra. */
  actualizar(id: number, request: GuardarCompraRequest): Observable<Notificacion<string>> {
    return this.http.put<Notificacion<string>>(`${this.baseUri}/${id}`, request);
  }

  /** Elimina (baja lógica) una compra. */
  eliminar(id: number): Observable<Notificacion<string>> {
    return this.http.delete<Notificacion<string>>(`${this.baseUri}/${id}`);
  }

  /** Catálogo de estatus de compra. */
  obtenerEstatus(): Observable<EstatusCompra[]> {
    return this.http
      .get<Notificacion<EstatusCompra[]>>(`${this.baseUri}/estatus`)
      .pipe(map((res) => (res?.modelo ?? []).map((e) => new EstatusCompraModel(e))));
  }

  /** Catálogo de almacenes de la sucursal de operación (Uruapan). */
  obtenerAlmacenes(): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(`${this.baseUri}/catalogos/almacenes`)
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CatalogoModel(c))));
  }

  private mapPage(res: Notificacion<Compra[]>): PagedResult<Compra> {
    return {
      data: (res?.modelo ?? []).map((c) => new CompraModel(c)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
