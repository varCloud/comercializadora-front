// Fila del listado (sin paginar) de "Reportes > Ventas" (paridad de columnas con
// Views/Reportes/_Ventas.cshtml del legado, 17 campos). Un archivo = una interfaz + su
// modelo (regla 11). Nombres de campo = contrato JSON de la API (camelCase, español).

export interface VentaReporteItem {
  fecha: string;
  sucursal: string;
  tienda: string;
  cajero: string;
  folio: number;
  cliente: string;
  codigoBarras: string;
  lineaProducto: string;
  producto: string;
  cantidad: number;
  precioVenta: number;
  iva: number;
  montoTotal: number;
  costoCompra: number;
  utilidad: number;
  margenBruto: number;
  formaPago: string;
}

export class VentaReporteItemModel implements VentaReporteItem {
  fecha: string;
  sucursal: string;
  tienda: string;
  cajero: string;
  folio: number;
  cliente: string;
  codigoBarras: string;
  lineaProducto: string;
  producto: string;
  cantidad: number;
  precioVenta: number;
  iva: number;
  montoTotal: number;
  costoCompra: number;
  utilidad: number;
  margenBruto: number;
  formaPago: string;

  constructor(data: Partial<VentaReporteItem> = {}) {
    this.fecha = data.fecha ?? '';
    this.sucursal = data.sucursal ?? '';
    this.tienda = data.tienda ?? '';
    this.cajero = data.cajero ?? '';
    this.folio = data.folio ?? 0;
    this.cliente = data.cliente ?? '';
    this.codigoBarras = data.codigoBarras ?? '';
    this.lineaProducto = data.lineaProducto ?? '';
    this.producto = data.producto ?? '';
    this.cantidad = data.cantidad ?? 0;
    this.precioVenta = data.precioVenta ?? 0;
    this.iva = data.iva ?? 0;
    this.montoTotal = data.montoTotal ?? 0;
    this.costoCompra = data.costoCompra ?? 0;
    this.utilidad = data.utilidad ?? 0;
    this.margenBruto = data.margenBruto ?? 0;
    this.formaPago = data.formaPago ?? '';
  }
}
