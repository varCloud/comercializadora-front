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
  CostoProduccionAgranel,
  CostoProduccionAgranelModel,
} from 'src/app/admin/models/consumo-mpl/costo-produccion-agranel';

/**
 * Servicio HTTP del reporte "Consumo de MPL" (nombre técnico legado "Costo de Producción
 * Agranel"). Migra `ReportesController.CostoProduccionAgranel/ObtenerCostoProduccion` (regla 02).
 * Solo vive aquí lo propio de este reporte: el listado y sus catálogos derivados de años/meses.
 * Los catálogos de Almacén y Línea de producto NO se duplican aquí (regla 00): el componente los
 * consume directo de `UsuariosService.obtenerAlmacenes` y `ProductosService.obtenerLineas`
 * (este último extendido con `idAlmacen` opcional para la cascada Almacén→Línea).
 */
@Injectable({ providedIn: 'root' })
export class ConsumoMplService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.CONSUMO_MPL}`;

  /** Listado paginado. Filtros: anioCalculo, mesCalculo, idAlmacen, idLineaProducto (0/ausente = TODOS). */
  listar(opts: ListarParams = {}): Observable<PagedResult<CostoProduccionAgranel>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<CostoProduccionAgranel[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<CostoProduccionAgranel>> {
    return this.http
      .get<Notificacion<CostoProduccionAgranel[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Catálogo de años disponibles para el filtro Año. */
  obtenerAnios(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/catalogos/anios`);
  }

  /** Catálogo de meses disponibles para el año dado (cascada Año → Mes). `anio` opcional. */
  obtenerMeses(anio?: number | null): Observable<Catalogo[]> {
    const params = anio ? new HttpParams().set('anio', anio) : undefined;
    return this.obtenerCatalogo(`${this.baseUri}/catalogos/meses`, params);
  }

  private obtenerCatalogo(uri: string, params?: HttpParams): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(uri, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CatalogoModel(c))));
  }

  private mapPage(
    res: Notificacion<CostoProduccionAgranel[]>,
  ): PagedResult<CostoProduccionAgranel> {
    return {
      data: (res?.modelo ?? []).map((c) => new CostoProduccionAgranelModel(c)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
