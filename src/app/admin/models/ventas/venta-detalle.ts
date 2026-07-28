// Línea de un ticket de venta, tal como la devuelve la API (GET /ventas/{id}, detalle del
// ticket). Mapea 1:1 la entidad `VentaDetalle` de comercializadora-api. Un archivo = una
// interfaz + su modelo (regla 11). Nombres de campo = contrato JSON de la API (camelCase).

export interface VentaDetalle {
  idVenta: number;
  idProducto: number;
  descProducto: string;
  idAlmacen: number;
  almacen: string;
  cantidad: number;
  monto: number;
  montoIVA: number;
  montoComisionBancaria: number;
  ahorro: number;
  precioVenta: number;
  idVentaDetalle: number;
  formaPago: number;
  descFormaPago: string;
  productosDevueltos: number;
  productosAgregados: number;
  tipoVenta: number;
  codigoBarras: string;
  montoPagado: number;
  estatusVenta: number;
  idDevolucion: number;
  idComplemento: number;
  ultimoCostoCompra: number;
  idPedidoEspecial: number;
}

export class VentaDetalleModel implements VentaDetalle {
  idVenta: number;
  idProducto: number;
  descProducto: string;
  idAlmacen: number;
  almacen: string;
  cantidad: number;
  monto: number;
  montoIVA: number;
  montoComisionBancaria: number;
  ahorro: number;
  precioVenta: number;
  idVentaDetalle: number;
  formaPago: number;
  descFormaPago: string;
  productosDevueltos: number;
  productosAgregados: number;
  tipoVenta: number;
  codigoBarras: string;
  montoPagado: number;
  estatusVenta: number;
  idDevolucion: number;
  idComplemento: number;
  ultimoCostoCompra: number;
  idPedidoEspecial: number;

  constructor(data: Partial<VentaDetalle> = {}) {
    this.idVenta = data.idVenta ?? 0;
    this.idProducto = data.idProducto ?? 0;
    this.descProducto = data.descProducto ?? '';
    this.idAlmacen = data.idAlmacen ?? 0;
    this.almacen = data.almacen ?? '';
    this.cantidad = data.cantidad ?? 0;
    this.monto = data.monto ?? 0;
    this.montoIVA = data.montoIVA ?? 0;
    this.montoComisionBancaria = data.montoComisionBancaria ?? 0;
    this.ahorro = data.ahorro ?? 0;
    this.precioVenta = data.precioVenta ?? 0;
    this.idVentaDetalle = data.idVentaDetalle ?? 0;
    this.formaPago = data.formaPago ?? 0;
    this.descFormaPago = data.descFormaPago ?? '';
    this.productosDevueltos = data.productosDevueltos ?? 0;
    this.productosAgregados = data.productosAgregados ?? 0;
    this.tipoVenta = data.tipoVenta ?? 0;
    this.codigoBarras = data.codigoBarras ?? '';
    this.montoPagado = data.montoPagado ?? 0;
    this.estatusVenta = data.estatusVenta ?? 0;
    this.idDevolucion = data.idDevolucion ?? 0;
    this.idComplemento = data.idComplemento ?? 0;
    this.ultimoCostoCompra = data.ultimoCostoCompra ?? 0;
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
  }
}
