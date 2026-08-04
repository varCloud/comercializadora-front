// Línea de producto devuelto enviada al registrar una devolución
// (POST /pedidos-especiales/{folio}/devolucion). Mapea 1:1 `ProductoDevueltoRequest` de
// comercializadora-api. El SP (`SP_REALIZA_DEVOLUCION_PEDIDOS_ESPECIALES`, vía
// `@xmlProductos.nodes(...)`) solo lee `idPedidoEspecialDetalle`, `idProducto` y
// `productosDevueltos` — el campo `cantidad` que el legado sí armaba en el JS no se lee, así que
// no se manda (verificado contra la definición real del SP, mismo criterio que
// `ConfirmacionProductoRequest`/Bloque B). Un archivo = una interfaz + su modelo (regla 09/11).
export interface ProductoDevueltoRequest {
  idProducto: number;
  idPedidoEspecialDetalle: number;
  productosDevueltos: number;
}

export class ProductoDevueltoRequestModel implements ProductoDevueltoRequest {
  idProducto: number;
  idPedidoEspecialDetalle: number;
  productosDevueltos: number;

  constructor(data: Partial<ProductoDevueltoRequest> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.idPedidoEspecialDetalle = data.idPedidoEspecialDetalle ?? 0;
    this.productosDevueltos = data.productosDevueltos ?? 0;
  }
}
