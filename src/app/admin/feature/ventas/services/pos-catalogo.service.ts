import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, forkJoin, map, reduce, shareReplay } from 'rxjs';
import { Producto } from 'src/app/admin/models/productos/producto';
import { RangoPrecio } from 'src/app/admin/models/productos/rango-precio';
import { PagedResult } from 'src/app/admin/models/shared/paged-result';
import { ExistenciaProducto } from 'src/app/admin/models/ventas/existencia-producto';
import { ProductoVenta, ProductoVentaModel } from 'src/app/admin/models/ventas/producto-venta';
import { ProductosService } from 'src/app/admin/services/productos.service';
import { VentasService } from 'src/app/admin/services/ventas.service';

/** Tamaño de página al recorrer TODO el catálogo de productos activos (menos round-trips). */
const CATALOGO_PAGE_SIZE = 500;

/**
 * Composición del catálogo de productos para el POS (FE-A5a/FE-A5a-existencias), reemplazo real
 * de `pos-catalogo-mock.service.ts`. Reusa `ProductosService`/`VentasService` (regla 00 — no
 * duplica HTTP):
 *
 * - `obtenerCatalogoProductos()`: recorre TODAS las páginas de `GET /productos` (solo trae
 *   activos, SP_V2_CONSULTA_PRODUCTOS ya filtra `activo = 1`) y las cruza contra
 *   `GET /ventas/existencias` (API-A6) por `idProducto`, equivalente a `arrayProductos` del
 *   legado (ya con `cantidad` real). Producto sin entrada en existencias → `existencia = 0`.
 * - `obtenerRangosProducto()`: LAZY, una sola llamada por producto (cacheada) a
 *   `GET /productos/{id}/precios`, la primera vez que ese producto se agrega al ticket. No hay
 *   endpoint bulk en la API nueva (el legado sí tenía uno: `/Productos/ObtenerPrecios` con
 *   idProducto=0) — ver nota detallada en `producto-venta.ts`.
 */
@Injectable({ providedIn: 'root' })
export class PosCatalogoService {
  private readonly productosService = inject(ProductosService);
  private readonly ventasService = inject(VentasService);

  private readonly rangosCache = new Map<number, Observable<RangoPrecio[]>>();

  /** Carga completa del catálogo activo + existencias (equivalente a `arrayProductos` del legado). */
  obtenerCatalogoProductos(): Observable<ProductoVenta[]> {
    const productos$ = this.productosService.listar({ page: 1, perPage: CATALOGO_PAGE_SIZE }).pipe(
      expand((pagina) =>
        pagina.meta.currentPage < pagina.meta.lastPage
          ? this.productosService.listar({
              page: pagina.meta.currentPage + 1,
              perPage: CATALOGO_PAGE_SIZE,
            })
          : EMPTY,
      ),
      reduce<PagedResult<Producto>, Producto[]>((acc, pagina) => [...acc, ...pagina.data], []),
    );

    return forkJoin([productos$, this.ventasService.obtenerExistencias()]).pipe(
      map(([productos, existencias]) => {
        const existenciaPorProducto = this.indexarExistencias(existencias);
        return productos.map((p) =>
          this.mapProductoVenta(p, existenciaPorProducto.get(p.idProducto) ?? 0),
        );
      }),
    );
  }

  private indexarExistencias(existencias: ExistenciaProducto[]): Map<number, number> {
    return new Map(existencias.map((e) => [e.idProducto, e.cantidad]));
  }

  /**
   * Rangos de precio por volumen de un producto (`GET /productos/{id}/precios`, solo la
   * porción de rangos). Cacheado en memoria: solo se pide una vez por producto por sesión de
   * pantalla (compartido entre reintentos concurrentes vía `shareReplay`).
   */
  obtenerRangosProducto(idProducto: number): Observable<RangoPrecio[]> {
    let obs$ = this.rangosCache.get(idProducto);
    if (!obs$) {
      obs$ = this.productosService.obtenerPrecios(idProducto).pipe(
        map((precios) => precios.rangos),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.rangosCache.set(idProducto, obs$);
    }
    return obs$;
  }

  private mapProductoVenta(p: Producto, existencia: number): ProductoVenta {
    return new ProductoVentaModel({
      idProducto: p.idProducto,
      descripcion: p.descripcion,
      codigoBarras: p.codigoBarras,
      idLineaProducto: p.idLineaProducto,
      precioIndividual: p.precioIndividual ?? 0,
      precioMenudeo: p.precioMenudeo ?? 0,
      ultimoCostoCompra: p.ultimoCostoCompra ?? 0,
      existencia,
      fraccion: p.fraccion,
      rangos: [],
    });
  }
}
