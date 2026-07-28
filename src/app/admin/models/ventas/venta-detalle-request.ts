// Línea del ticket que se envía al guardar una venta (POST /ventas). Mapea 1:1 el DTO
// `VentaDetalleRequest` de comercializadora-api. El repositorio de la API combina estos campos
// con el contexto de la venta (cliente/forma de pago/usuario/estación) para armar el XML que
// espera SP_REALIZA_VENTA (el SP no se modifica) — a diferencia del legado (que solo mandaba
// idProducto/cantidad y dejaba todo lo demás a cargo del SP), el DTO nuevo sí reenvía
// precio/costo/descuento/montoTotal ya resueltos por el front (ver VentaRepository.GuardarAsync).
// Un archivo = una interfaz + su modelo (regla 11).

export interface VentaDetalleRequest {
  idProducto: number;
  descripcionProducto: string;
  idLineaProducto: number;
  cantidad: number;

  /** Precio unitario aplicado a la línea (ya resuelto por precio-volumen si aplica). */
  precio: number;
  precioVenta: number;
  costo: number;
  ganancia: number;
  descuento: number;
  montoTotal: number;

  /** 0 = línea nueva; > 0 al editar/complementar una línea existente. */
  idVentaDetalle: number;

  /** Cantidad devuelta de esta línea (modo Devolución — fuera de alcance de esta pantalla). */
  productosDevueltos: number;

  /** Cantidad agregada a esta línea (modo Complemento — fuera de alcance de esta pantalla). */
  productosAgregados: number;

  ultimoCostoCompra: number;
}

export class VentaDetalleRequestModel implements VentaDetalleRequest {
  idProducto: number;
  descripcionProducto: string;
  idLineaProducto: number;
  cantidad: number;
  precio: number;
  precioVenta: number;
  costo: number;
  ganancia: number;
  descuento: number;
  montoTotal: number;
  idVentaDetalle: number;
  productosDevueltos: number;
  productosAgregados: number;
  ultimoCostoCompra: number;

  constructor(data: Partial<VentaDetalleRequest> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.descripcionProducto = data.descripcionProducto ?? '';
    this.idLineaProducto = data.idLineaProducto ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.precio = data.precio ?? 0;
    this.precioVenta = data.precioVenta ?? 0;
    this.costo = data.costo ?? 0;
    this.ganancia = data.ganancia ?? 0;
    this.descuento = data.descuento ?? 0;
    this.montoTotal = data.montoTotal ?? 0;
    this.idVentaDetalle = data.idVentaDetalle ?? 0;
    this.productosDevueltos = data.productosDevueltos ?? 0;
    this.productosAgregados = data.productosAgregados ?? 0;
    this.ultimoCostoCompra = data.ultimoCostoCompra ?? 0;
  }
}
