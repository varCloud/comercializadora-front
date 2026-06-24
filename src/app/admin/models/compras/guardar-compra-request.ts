// Payload de alta/edición de compra (POST/PUT). La API serializa `productos` al XML
// <ArrayOfProducto> que espera SP_REGISTRA_COMPRA. El idUsuario NO viaja aquí: lo toma del JWT.
// Un archivo = una interfaz + su modelo (regla 11).

export interface CompraProductoRequest {
  idProducto: number;
  cantidad: number;
  precio: number;
}

export interface GuardarCompraRequest {
  idCompra: number;
  idProveedor: number;
  idStatusCompra: number;
  observaciones: string;
  idAlmacen: number;
  productos: CompraProductoRequest[];
}

export class GuardarCompraRequestModel implements GuardarCompraRequest {
  idCompra: number;
  idProveedor: number;
  idStatusCompra: number;
  observaciones: string;
  idAlmacen: number;
  productos: CompraProductoRequest[];

  constructor(data: Partial<GuardarCompraRequest> = {}) {
    this.idCompra = data.idCompra ?? 0;
    this.idProveedor = data.idProveedor ?? 0;
    this.idStatusCompra = data.idStatusCompra ?? 0;
    this.observaciones = data.observaciones ?? '';
    this.idAlmacen = data.idAlmacen ?? 0;
    this.productos = data.productos ?? [];
  }
}
