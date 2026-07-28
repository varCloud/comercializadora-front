// Producto del catálogo del POS (equivalente al `arrayProductos` del legado EvtVentas.js:
// carga completa del catálogo al entrar a la pantalla de Ventas). Un archivo = una interfaz +
// su modelo (regla 11).
//
// FE-A5 (integración real) — resuelto vía `pos-catalogo.service.ts`, componiendo endpoints ya
// migrados de `ProductosService` (regla 00, sin inventar nada nuevo):
// - descripcion/codigoBarras/precioIndividual/precioMenudeo/fraccion/idLineaProducto/
//   ultimoCostoCompra: `GET /productos` (paginado, se recorren todas las páginas).
// - rangos: NO hay endpoint bulk (a diferencia del legado, que cargaba
//   `/Productos/ObtenerPrecios` con idProducto=0 una sola vez para TODOS los productos). La API
//   nueva solo expone `GET /productos/{id}/precios` por producto
//   (SP_V2_CONSULTA_PRECIOS_PRODUCTO admite un único @idProducto). Se resuelve componiendo del
//   lado del cliente: se piden LAZY (la primera vez que el producto se agrega al ticket), no al
//   cargar el catálogo completo — evitaría cientos/miles de llamadas innecesarias.
// - existencia: `GET /ventas/existencias` (SP_V2_CONSULTA_EXISTENCIA_PRODUCTOS, API-A6). Masivo
//   por almacén (el `idAlmacen` se resuelve del JWT), se cruza en el cliente contra el catálogo
//   por `idProducto`. Si un producto no aparece en la respuesta, se trata como `cantidad = 0`
//   (el endpoint ya cubre todos los productos activos del almacén — ausencia = sin stock, no
//   "sin control").

import { RangoPrecio, RangoPrecioModel } from 'src/app/admin/models/productos/rango-precio';

export interface ProductoVenta {
  idProducto: number;
  descripcion: string;
  codigoBarras: string;
  idLineaProducto: number;
  /** Precio unitario normal ("Precio Menudeo" en UI — ver nota en precios-producto.ts). */
  precioIndividual: number;
  /** Precio aplicado por defecto cuando el ticket completo alcanza 6+ artículos ("Precio Mayoreo"). */
  precioMenudeo: number;
  /** Último costo de compra (para armar costo/ganancia del detalle al guardar la venta). */
  ultimoCostoCompra: number;
  /** Existencia disponible en almacén (0 si el producto no aparece en `GET /ventas/existencias`). */
  existencia: number;
  /** Permite cantidad decimal (legado: idUnidadMedida Kilogramo/Gramo/Litro/Mililitro). */
  fraccion: boolean;
  /** Rangos propios de precio por volumen del producto (cargados LAZY, ver nota arriba). */
  rangos: RangoPrecio[];
}

export class ProductoVentaModel implements ProductoVenta {
  idProducto: number;
  descripcion: string;
  codigoBarras: string;
  idLineaProducto: number;
  precioIndividual: number;
  precioMenudeo: number;
  ultimoCostoCompra: number;
  existencia: number;
  fraccion: boolean;
  rangos: RangoPrecio[];

  constructor(data: Partial<ProductoVenta> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.codigoBarras = data.codigoBarras ?? '';
    this.idLineaProducto = data.idLineaProducto ?? 0;
    this.precioIndividual = data.precioIndividual ?? 0;
    this.precioMenudeo = data.precioMenudeo ?? 0;
    this.ultimoCostoCompra = data.ultimoCostoCompra ?? 0;
    this.existencia = data.existencia ?? 0;
    this.fraccion = data.fraccion ?? false;
    this.rangos = (data.rangos ?? []).map((r) => new RangoPrecioModel(r));
  }
}
