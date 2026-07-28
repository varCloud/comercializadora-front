// Encabezado de una venta (ticket), tal como la devuelve la API: `POST /ventas` (respuesta
// mínima: idVenta/cantProductosLiq/idDevolucion/idComplemento) y `GET /ventas/{id}`
// (encabezado completo + `detalles`). Mapea 1:1 la entidad `Venta` de comercializadora-api.
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON (camelCase).

import { VentaDetalle, VentaDetalleModel } from 'src/app/admin/models/ventas/venta-detalle';

export interface Venta {
  idVenta: number;
  idCliente: number;
  nombreCliente: string;
  fechaAlta: string;
  idUsuario: number;
  nombreUsuario: string;

  montoTotal: number;
  montoIVA: number;
  descuento: number;

  idFactFormaPago: number;
  descripcionFactFormaPago: string;
  idFactUsoCFDI: number;

  idFactura: number;
  idEstatusFactura: number;
  descripcionEstatusFactura: string;
  rutaFactura: string;

  idSucursal: number;
  descSucursal: string;
  tipoCliente: string;

  codigoBarras: string;
  codigoBarrasTicket: string;

  esDevolucion: boolean;
  esAgregarProductos: boolean;
  productosDevueltos: number;
  productosAgregados: number;

  idAlmacen: number;
  descAlmacen: string;
  descripcionAlmacen: string;

  cantProductosLiq: number;
  idPedidoEspecial: number;

  tipoVenta: number;
  estatusVenta: number;
  fechaCancelacion: string | null;

  idDevolucion: number;
  idComplemento: number;
  puedeHacerComplementos: boolean;
  diasPasadosVentaInicial: number;

  /** Solo viene poblado en `GET /ventas/{id}` (segunda consulta del backend a SP_CONSULTA_TICKET). */
  detalles: VentaDetalle[];
}

export class VentaModel implements Venta {
  idVenta: number;
  idCliente: number;
  nombreCliente: string;
  fechaAlta: string;
  idUsuario: number;
  nombreUsuario: string;

  montoTotal: number;
  montoIVA: number;
  descuento: number;

  idFactFormaPago: number;
  descripcionFactFormaPago: string;
  idFactUsoCFDI: number;

  idFactura: number;
  idEstatusFactura: number;
  descripcionEstatusFactura: string;
  rutaFactura: string;

  idSucursal: number;
  descSucursal: string;
  tipoCliente: string;

  codigoBarras: string;
  codigoBarrasTicket: string;

  esDevolucion: boolean;
  esAgregarProductos: boolean;
  productosDevueltos: number;
  productosAgregados: number;

  idAlmacen: number;
  descAlmacen: string;
  descripcionAlmacen: string;

  cantProductosLiq: number;
  idPedidoEspecial: number;

  tipoVenta: number;
  estatusVenta: number;
  fechaCancelacion: string | null;

  idDevolucion: number;
  idComplemento: number;
  puedeHacerComplementos: boolean;
  diasPasadosVentaInicial: number;

  detalles: VentaDetalle[];

  constructor(data: Partial<Venta> = {}) {
    this.idVenta = data.idVenta ?? 0;
    this.idCliente = data.idCliente ?? 0;
    this.nombreCliente = data.nombreCliente ?? '';
    this.fechaAlta = data.fechaAlta ?? '';
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreUsuario = data.nombreUsuario ?? '';

    this.montoTotal = data.montoTotal ?? 0;
    this.montoIVA = data.montoIVA ?? 0;
    this.descuento = data.descuento ?? 0;

    this.idFactFormaPago = data.idFactFormaPago ?? 0;
    this.descripcionFactFormaPago = data.descripcionFactFormaPago ?? '';
    this.idFactUsoCFDI = data.idFactUsoCFDI ?? 0;

    this.idFactura = data.idFactura ?? 0;
    this.idEstatusFactura = data.idEstatusFactura ?? 0;
    this.descripcionEstatusFactura = data.descripcionEstatusFactura ?? '';
    this.rutaFactura = data.rutaFactura ?? '';

    this.idSucursal = data.idSucursal ?? 0;
    this.descSucursal = data.descSucursal ?? '';
    this.tipoCliente = data.tipoCliente ?? '';

    this.codigoBarras = data.codigoBarras ?? '';
    this.codigoBarrasTicket = data.codigoBarrasTicket ?? '';

    this.esDevolucion = data.esDevolucion ?? false;
    this.esAgregarProductos = data.esAgregarProductos ?? false;
    this.productosDevueltos = data.productosDevueltos ?? 0;
    this.productosAgregados = data.productosAgregados ?? 0;

    this.idAlmacen = data.idAlmacen ?? 0;
    this.descAlmacen = data.descAlmacen ?? '';
    this.descripcionAlmacen = data.descripcionAlmacen ?? '';

    this.cantProductosLiq = data.cantProductosLiq ?? 0;
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;

    this.tipoVenta = data.tipoVenta ?? 0;
    this.estatusVenta = data.estatusVenta ?? 0;
    this.fechaCancelacion = data.fechaCancelacion ?? null;

    this.idDevolucion = data.idDevolucion ?? 0;
    this.idComplemento = data.idComplemento ?? 0;
    this.puedeHacerComplementos = data.puedeHacerComplementos ?? false;
    this.diasPasadosVentaInicial = data.diasPasadosVentaInicial ?? 0;

    this.detalles = (data.detalles ?? []).map((d) => new VentaDetalleModel(d));
  }
}
