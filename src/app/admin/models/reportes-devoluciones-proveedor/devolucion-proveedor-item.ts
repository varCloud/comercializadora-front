// Fila del listado de "Reportes > Devoluciones a Proveedor" (paridad de campos con el contrato
// de la API descrito en hu_reporte_devoluciones_proveedor.md — back-end aún pendiente,
// FE-3/FE-4). "Motivo Devolución" (`observaciones`) sale de `producto.observaciones` en el
// legado, NO de `DevolucionProveedor.Observaciones` (campo no usado en la vista) — ver HU. Un
// archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON de la API
// (camelCase, regla 09).

export interface DevolucionProveedorItem {
  idDevolucion: number;
  fecha: string;
  idCompra: number;
  idProducto: number;
  codigoBarras: string;
  descripcionLinea: string;
  descripcion: string;
  cantidad: number;
  cantidadRecibida: number;
  cantidadDevuelta: number;
  /** Motivo de la devolución (`producto.observaciones` en el legado, ver comentario de arriba). */
  observaciones: string;
  idUsuario: number;
  nombreUsuario: string;
  idProveedor: number;
  nombreProveedor: string;
}

export class DevolucionProveedorItemModel implements DevolucionProveedorItem {
  idDevolucion: number;
  fecha: string;
  idCompra: number;
  idProducto: number;
  codigoBarras: string;
  descripcionLinea: string;
  descripcion: string;
  cantidad: number;
  cantidadRecibida: number;
  cantidadDevuelta: number;
  observaciones: string;
  idUsuario: number;
  nombreUsuario: string;
  idProveedor: number;
  nombreProveedor: string;

  constructor(data: Partial<DevolucionProveedorItem> = {}) {
    this.idDevolucion = data.idDevolucion ?? 0;
    this.fecha = data.fecha ?? '';
    this.idCompra = data.idCompra ?? 0;
    this.idProducto = data.idProducto ?? 0;
    this.codigoBarras = data.codigoBarras ?? '';
    this.descripcionLinea = data.descripcionLinea ?? '';
    this.descripcion = data.descripcion ?? '';
    this.cantidad = data.cantidad ?? 0;
    this.cantidadRecibida = data.cantidadRecibida ?? 0;
    this.cantidadDevuelta = data.cantidadDevuelta ?? 0;
    this.observaciones = data.observaciones ?? '';
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreUsuario = data.nombreUsuario ?? '';
    this.idProveedor = data.idProveedor ?? 0;
    this.nombreProveedor = data.nombreProveedor ?? '';
  }
}
