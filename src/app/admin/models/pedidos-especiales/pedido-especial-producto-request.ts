// Línea de producto enviada al guardar un pedido especial (POST /pedidos-especiales). Mapea
// 1:1 `PedidoEspecialProductoRequest` de comercializadora-api — solo estas 3 columnas, el resto
// de datos del producto (descripción, precio…) no los usa el SP. Un archivo = una interfaz + su
// modelo (regla 09/11). Nombres de campo = contrato JSON de la API (camelCase).

export interface PedidoEspecialProductoRequest {
  idProducto: number;
  cantidad: number;
  idAlmacen: number;
}

export class PedidoEspecialProductoRequestModel implements PedidoEspecialProductoRequest {
  idProducto: number;
  cantidad: number;
  idAlmacen: number;

  constructor(data: Partial<PedidoEspecialProductoRequest> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.idAlmacen = data.idAlmacen ?? 0;
  }
}
