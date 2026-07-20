// Fila del listado (paginado) de "Reportes > Devoluciones" (paridad de campos con
// `DevolucionItem.cs` del back-end, que a su vez mapea el resultset único de
// `SP_CONSULTA_DEVOLUCIONES_Y_COMPLEMENTOS`, UNION Devoluciones/Complementos según
// `@idTipoConsulta`). Un archivo = una interfaz + su modelo (regla 11). Nombres de campo =
// contrato JSON de la API (camelCase).

export interface DevolucionItem {
  idVenta: number;
  idUsuario: number;
  nombreUsuario: string;
  idCliente: number;
  nombreCliente: string;
  idSucursal: number;
  idAlmacen: number;
  idProducto: number;
  descripcionProducto: string;
  cantidad: number;
  montoTotal: number;
  precioVenta: number;
  fechaAlta: string;
  descAlmacen: string;
  codigoBarras: string;
  /** Etiqueta literal que arma el propio SP: "Devolución" | "Complemento". */
  descripcion: string;
}

export class DevolucionItemModel implements DevolucionItem {
  idVenta: number;
  idUsuario: number;
  nombreUsuario: string;
  idCliente: number;
  nombreCliente: string;
  idSucursal: number;
  idAlmacen: number;
  idProducto: number;
  descripcionProducto: string;
  cantidad: number;
  montoTotal: number;
  precioVenta: number;
  fechaAlta: string;
  descAlmacen: string;
  codigoBarras: string;
  descripcion: string;

  constructor(data: Partial<DevolucionItem> = {}) {
    this.idVenta = data.idVenta ?? 0;
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreUsuario = data.nombreUsuario ?? '';
    this.idCliente = data.idCliente ?? 0;
    this.nombreCliente = data.nombreCliente ?? '';
    this.idSucursal = data.idSucursal ?? 0;
    this.idAlmacen = data.idAlmacen ?? 0;
    this.idProducto = data.idProducto ?? 0;
    this.descripcionProducto = data.descripcionProducto ?? '';
    this.cantidad = data.cantidad ?? 0;
    this.montoTotal = data.montoTotal ?? 0;
    this.precioVenta = data.precioVenta ?? 0;
    this.fechaAlta = data.fechaAlta ?? '';
    this.descAlmacen = data.descAlmacen ?? '';
    this.codigoBarras = data.codigoBarras ?? '';
    this.descripcion = data.descripcion ?? '';
  }
}
