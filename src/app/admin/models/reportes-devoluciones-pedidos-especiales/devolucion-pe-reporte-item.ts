// Fila del listado de "Reportes > Devoluciones Pedidos Especiales" (paridad de columnas con el
// reporte legado `Views/Reportes/_DevolucionesPedidosEspeciales.cshtml`, SP
// `SP_CONSULTA_DEVOLUCIONES_PEDIDOS_ESPECIALESV2`). Un archivo = una interfaz + su modelo
// (regla 11). Nombres de campo = contrato JSON que expondrá la API (camelCase, español),
// confirmado en el paso 02 (`task_reporte_devoluciones_pedidos_esp.md`).
//
// Hermano de `VentaPeReporteItem` (reportes-ventas-pedidos-especiales) — mismo tipo de reporte,
// distinto origen de datos (devoluciones en vez de ventas).

export interface DevolucionPeReporteItem {
  idPedidoEspecial: number;
  idUsuario: number;
  nombreUsuario: string;
  idCliente: number;
  nombreCliente: string;
  idSucursal: number;
  idAlmacen: number;
  idProducto: number;
  producto: string;
  cantidad: number;
  precioVenta: number;
  montoTotal: number;
  codigoBarrasTicket: string;
  tienda: string;
  fechaAlta: string;
}

export class DevolucionPeReporteItemModel implements DevolucionPeReporteItem {
  idPedidoEspecial: number;
  idUsuario: number;
  nombreUsuario: string;
  idCliente: number;
  nombreCliente: string;
  idSucursal: number;
  idAlmacen: number;
  idProducto: number;
  producto: string;
  cantidad: number;
  precioVenta: number;
  montoTotal: number;
  codigoBarrasTicket: string;
  tienda: string;
  fechaAlta: string;

  constructor(data: Partial<DevolucionPeReporteItem> = {}) {
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreUsuario = data.nombreUsuario ?? '';
    this.idCliente = data.idCliente ?? 0;
    this.nombreCliente = data.nombreCliente ?? '';
    this.idSucursal = data.idSucursal ?? 0;
    this.idAlmacen = data.idAlmacen ?? 0;
    this.idProducto = data.idProducto ?? 0;
    this.producto = data.producto ?? '';
    this.cantidad = data.cantidad ?? 0;
    this.precioVenta = data.precioVenta ?? 0;
    this.montoTotal = data.montoTotal ?? 0;
    this.codigoBarrasTicket = data.codigoBarrasTicket ?? '';
    this.tienda = data.tienda ?? '';
    this.fechaAlta = data.fechaAlta ?? '';
  }
}
