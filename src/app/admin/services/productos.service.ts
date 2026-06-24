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
import { ProductoCodigoBarra } from 'src/app/admin/models/productos/producto-codigo-barra';
import { ClaveSat, ClaveSatModel } from 'src/app/admin/models/productos/clave-sat';
import { GuardarProductoRequest } from 'src/app/admin/models/productos/guardar-producto-request';
import {
  PreciosProducto,
  PreciosProductoModel,
} from 'src/app/admin/models/productos/precios-producto';
import { GuardarPreciosRequest } from 'src/app/admin/models/productos/guardar-precios-request';

/**
 * Servicio HTTP del módulo de Productos. Consume la API nueva (comercializadora-api).
 * Listado paginado (Notificacion con modelo/links/meta); navegación por links (irLink).
 */
@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.PRODUCTOS}`;

  /** Listado paginado. `q` busca por descripción/artículo/código; `idLineaProducto` filtra por línea. */
  listar(opts: ListarParams = {}): Observable<PagedResult<Producto>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<Producto[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last). */
  irLink(url: string): Observable<PagedResult<Producto>> {
    return this.http.get<Notificacion<Producto[]>>(url).pipe(map((res) => this.mapPage(res)));
  }

  obtenerPorId(id: number): Observable<Producto | null> {
    return this.http
      .get<Notificacion<Producto>>(`${this.baseUri}/${id}`)
      .pipe(map((res) => (res?.modelo ? new ProductoModel(res.modelo) : null)));
  }

  crear(request: GuardarProductoRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(this.baseUri, request);
  }

  actualizar(id: number, request: GuardarProductoRequest): Observable<Notificacion<string>> {
    return this.http.put<Notificacion<string>>(`${this.baseUri}/${id}`, request);
  }

  cambiarEstatus(id: number, activo: boolean): Observable<Notificacion<string>> {
    return this.http.patch<Notificacion<string>>(`${this.baseUri}/${id}/estatus`, { activo });
  }

  /**
   * Búsqueda servidor PAGINADA de productos (selector paginado de Compras, regla 16).
   * Con `q` vacío devuelve la primera página (25) del catálogo, así el selector ya muestra
   * elementos al abrir sin necesidad de teclear. Reusa `listar` (SP_V2_CONSULTA_PRODUCTOS,
   * que devuelve descripción de unidad de compra/venta, último costo y fracción → el
   * autocompletado del modal sigue funcionando).
   */
  buscarPaginado(q: string, page = 1): Observable<Producto[]> {
    return this.listar({ q, page, perPage: 25 }).pipe(map((res) => res.data));
  }

  /**
   * @deprecated Búsqueda no paginada por descripción (devuelve vacío con `q` vacío).
   * Usa {@link buscarPaginado} para alimentar el selector paginado de productos.
   */
  buscarPorDescripcion(descripcion: string): Observable<Producto[]> {
    const params = new HttpParams().set('descripcion', descripcion);
    return this.http
      .get<Notificacion<Producto[]>>(`${this.baseUri}/buscar`, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((p) => new ProductoModel(p))));
  }

  /** Lectura exacta por código de barras (escaneo). */
  obtenerPorCodigo(codigo: string): Observable<Producto | null> {
    const params = new HttpParams().set('codigo', codigo);
    return this.http
      .get<Notificacion<Producto>>(`${this.baseUri}/por-codigo`, { params })
      .pipe(map((res) => (res?.modelo ? new ProductoModel(res.modelo) : null)));
  }

  /** Búsqueda servidor PAGINADA de claves SAT (para el selector paginado del formulario). */
  buscarClavesSat(q: string, page = 1): Observable<ClaveSat[]> {
    const params = new HttpParams()
      .set('q', q ?? '')
      .set('page', page)
      .set('perPage', 25);
    return this.http
      .get<Notificacion<ClaveSat[]>>(`${this.baseUri}/claves-sat`, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new ClaveSatModel(c))));
  }

  /** Precios de un producto (base + rangos de mayoreo). */
  obtenerPrecios(idProducto: number): Observable<PreciosProducto> {
    return this.http
      .get<Notificacion<PreciosProducto>>(`${this.baseUri}/${idProducto}/precios`)
      .pipe(map((res) => new PreciosProductoModel(res?.modelo ?? {})));
  }

  /** Guarda precios base + rangos de mayoreo de un producto. */
  guardarPrecios(idProducto: number, request: GuardarPreciosRequest): Observable<Notificacion<string>> {
    return this.http.put<Notificacion<string>>(`${this.baseUri}/${idProducto}/precios`, request);
  }

  /**
   * Todos los productos activos de una línea, con precios + código de barras
   * (alimenta "Agregar línea" del generador de códigos de barras).
   */
  obtenerProductosPorLinea(idLineaProducto: number): Observable<Producto[]> {
    const params = new HttpParams().set('idLineaProducto', idLineaProducto);
    return this.http
      .get<Notificacion<Producto[]>>(
        `${this.baseUri}/${URIS_CONFIG.CODIGOS_BARRAS}/por-linea`,
        { params },
      )
      .pipe(map((res) => (res?.modelo ?? []).map((p) => new ProductoModel(p))));
  }

  /** Genera el PDF de etiquetas de código de barras (devuelve el archivo como Blob). */
  generarCodigosBarras(productos: ProductoCodigoBarra[]): Observable<Blob> {
    return this.http.post(`${this.baseUri}/${URIS_CONFIG.CODIGOS_BARRAS}/generar`, productos, {
      responseType: 'blob',
    });
  }

  obtenerLineas(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/catalogos/lineas`);
  }

  obtenerUnidadesMedida(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/catalogos/unidades-medida`);
  }

  obtenerUnidadesCompra(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/catalogos/unidades-compra`);
  }

  private obtenerCatalogo(uri: string): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(uri)
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CatalogoModel(c))));
  }

  private mapPage(res: Notificacion<Producto[]>): PagedResult<Producto> {
    return {
      data: (res?.modelo ?? []).map((p) => new ProductoModel(p)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
