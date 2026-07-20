// Fila del listado de "Reportes > Compras" tal como la devuelve la API
// (SP_V2_CONSULTA_COMPRAS_REPORTE, resumido por compra). Un archivo = una interfaz + su modelo
// (regla 11). Nombres de campo = contrato JSON de la API (camelCase).

export interface CompraReporteItem {
  idCompra: number;
  fechaAlta: string;
  idProveedor: number;
  proveedorNombre: string;
  idStatus: number;
  estatusDescripcion: string;
  idUsuario: number;
  nombreCompleto: string;
  montoTotal: number;
  totalCantProductos: number;
}

export class CompraReporteItemModel implements CompraReporteItem {
  idCompra: number;
  fechaAlta: string;
  idProveedor: number;
  proveedorNombre: string;
  idStatus: number;
  estatusDescripcion: string;
  idUsuario: number;
  nombreCompleto: string;
  montoTotal: number;
  totalCantProductos: number;

  constructor(data: Partial<CompraReporteItem> = {}) {
    this.idCompra = data.idCompra ?? 0;
    this.fechaAlta = data.fechaAlta ?? '';
    this.idProveedor = data.idProveedor ?? 0;
    this.proveedorNombre = data.proveedorNombre ?? '';
    this.idStatus = data.idStatus ?? 0;
    this.estatusDescripcion = data.estatusDescripcion ?? '';
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreCompleto = data.nombreCompleto ?? '';
    this.montoTotal = data.montoTotal ?? 0;
    this.totalCantProductos = data.totalCantProductos ?? 0;
  }
}
