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
import {
  LimiteInventario,
  LimiteInventarioModel,
} from 'src/app/admin/models/limites-inventario/limite-inventario';
import { GuardarLimiteRequest } from 'src/app/admin/models/limites-inventario/guardar-limite-request';
import { LimiteMasivoItem } from 'src/app/admin/models/limites-inventario/limite-masivo-item';

/**
 * Servicio HTTP del módulo Límites de Inventario (regla 02). El token JWT lo agrega
 * auth.interceptor.ts. El listado es paginado (modelo/links/meta).
 */
@Injectable({ providedIn: 'root' })
export class LimitesInventarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.LIMITES_INVENTARIO}`;

  /** Listado paginado. `q` busca por producto/código/almacén/línea; filtros por almacén/línea/estatus. */
  listar(opts: ListarParams = {}): Observable<PagedResult<LimiteInventario>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<LimiteInventario[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last). */
  irLink(url: string): Observable<PagedResult<LimiteInventario>> {
    return this.http
      .get<Notificacion<LimiteInventario[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  private mapPage(res: Notificacion<LimiteInventario[]>): PagedResult<LimiteInventario> {
    return {
      data: (res?.modelo ?? []).map((l) => new LimiteInventarioModel(l)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }

  /** Catálogo de estatus de límite (1/2/3) para el filtro. */
  obtenerEstatus(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/estatus`);
  }

  /** Catálogo de almacenes (de la sucursal indicada) para el filtro. */
  obtenerAlmacenes(idSucursal: number): Observable<Catalogo[]> {
    const params = new HttpParams().set('idSucursal', idSucursal);
    return this.obtenerCatalogo(`${this.baseUri}/catalogos/almacenes`, params);
  }

  /** Catálogo de líneas de producto para el filtro. */
  obtenerLineas(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/catalogos/lineas`);
  }

  private obtenerCatalogo(uri: string, params?: HttpParams): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(uri, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CatalogoModel(c))));
  }

  /** Crea/actualiza el límite mín/máx de un producto en un almacén (PATCH). */
  guardar(request: GuardarLimiteRequest): Observable<Notificacion<string>> {
    return this.http.patch<Notificacion<string>>(this.baseUri, request);
  }

  /** Carga masiva de límites (filas del Excel parseado en el front). */
  guardarMasivo(limites: LimiteMasivoItem[]): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(`${this.baseUri}/masivo`, { limites });
  }
}
