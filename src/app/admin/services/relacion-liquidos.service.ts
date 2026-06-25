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
import { Producto, ProductoModel } from 'src/app/admin/models/productos/producto';
import {
  RelacionLiquido,
  RelacionLiquidoModel,
} from 'src/app/admin/models/relacion-liquidos/relacion-liquido';
import { GuardarRelacionLiquidoRequest } from 'src/app/admin/models/relacion-liquidos/guardar-relacion-liquido-request';

/**
 * Servicio HTTP del módulo "Relación Liquidos" (combinaciones granel → envasado → envase).
 * Consume la API nueva (comercializadora-api). Listado paginado (Notificacion con modelo/links/meta);
 * navegación por links (irLink). Los productos de cada selector se piden por `tipo` semántico
 * (granel | envasar | envase); el back resuelve las líneas de producto.
 */
@Injectable({ providedIn: 'root' })
export class RelacionLiquidosService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.RELACION_LIQUIDOS}`;

  /** Listado paginado. `q` busca por las descripciones de los 3 productos. */
  listar(opts: ListarParams = {}): Observable<PagedResult<RelacionLiquido>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<RelacionLiquido[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last). */
  irLink(url: string): Observable<PagedResult<RelacionLiquido>> {
    return this.http
      .get<Notificacion<RelacionLiquido[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  obtenerPorId(id: number): Observable<RelacionLiquido | null> {
    return this.http
      .get<Notificacion<RelacionLiquido>>(`${this.baseUri}/${id}`)
      .pipe(map((res) => (res?.modelo ? new RelacionLiquidoModel(res.modelo) : null)));
  }

  crear(request: GuardarRelacionLiquidoRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(this.baseUri, request);
  }

  actualizar(id: number, request: GuardarRelacionLiquidoRequest): Observable<Notificacion<string>> {
    return this.http.put<Notificacion<string>>(`${this.baseUri}/${id}`, request);
  }

  desactivar(id: number): Observable<Notificacion<string>> {
    return this.http.delete<Notificacion<string>>(`${this.baseUri}/${id}`);
  }

  /**
   * Búsqueda servidor PAGINADA de productos para un selector, por `tipo` (granel | envasar |
   * envase). Con `q` vacío trae la primera página (25) → el selector ya muestra opciones al abrir
   * (regla 16). Alimenta `fetchPage` de `app-select-paginado`.
   */
  buscarProductos(tipo: 'granel' | 'envasar' | 'envase', q: string, page = 1): Observable<Producto[]> {
    const params = new HttpParams()
      .set('tipo', tipo)
      .set('q', q ?? '')
      .set('page', page)
      .set('perPage', 25);
    return this.http
      .get<Notificacion<Producto[]>>(`${this.baseUri}/productos`, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((p) => new ProductoModel(p))));
  }

  /** Catálogo de unidades de medida válidas para líquidos a granel (subconjunto L/K). */
  obtenerUnidadesMedida(): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(`${this.baseUri}/unidades-medida`)
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CatalogoModel(c))));
  }

  private mapPage(res: Notificacion<RelacionLiquido[]>): PagedResult<RelacionLiquido> {
    return {
      data: (res?.modelo ?? []).map((r) => new RelacionLiquidoModel(r)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
