// Línea de producto enviada al confirmar productos de un pedido especial
// (POST /pedidos-especiales/{folio}/confirmacion). Mapea 1:1 `ConfirmacionProductoRequest` de
// comercializadora-api — mismo shape que `EvtConfirmarProductosV2.js` arma por fila de
// `#tblConfirmarProductos` en el legado (`cells[1]`=idProducto, `cells[6]`=cantidadSolicitada,
// `cells[8]`=cantidadAtendida, `cells[9]`=cantidadRechazada, `cells[10]`=cantidadAceptada,
// `cells[11]`=observaciones, `cells[13]`=idPedidoEspecialDetalle). Un archivo = una interfaz +
// su modelo (regla 09/11). `idPedidoEspecialDetalle` es `bigint` en la API pero viaja como
// `number` normal en TS/JSON (JS no distingue int/long; los valores reales no se acercan al
// límite seguro de precisión de `number`).

export interface ConfirmacionProductoRequest {
  idProducto: number;
  idPedidoEspecialDetalle: number;
  cantidadSolicitada: number;
  cantidadAtendida: number;
  cantidadRechazada: number;
  cantidadAceptada: number;
  observaciones: string | null;
}

export class ConfirmacionProductoRequestModel implements ConfirmacionProductoRequest {
  idProducto: number;
  idPedidoEspecialDetalle: number;
  cantidadSolicitada: number;
  cantidadAtendida: number;
  cantidadRechazada: number;
  cantidadAceptada: number;
  observaciones: string | null;

  constructor(data: Partial<ConfirmacionProductoRequest> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.idPedidoEspecialDetalle = data.idPedidoEspecialDetalle ?? 0;
    this.cantidadSolicitada = data.cantidadSolicitada ?? 0;
    this.cantidadAtendida = data.cantidadAtendida ?? 0;
    this.cantidadRechazada = data.cantidadRechazada ?? 0;
    this.cantidadAceptada = data.cantidadAceptada ?? 0;
    this.observaciones = data.observaciones ?? null;
  }
}
