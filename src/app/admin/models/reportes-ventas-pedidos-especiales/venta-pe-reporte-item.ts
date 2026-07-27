// Fila del listado (sin paginar) de "Reportes > Ventas Pedidos Especiales" (paridad de
// columnas con el reporte legado `Views/Reportes/_VentasPedidosEspeciales.cshtml`, 17 campos,
// SP `SP_CONSULTA_VENTAS_PEDIDOS_ESPECIALESV2`). Un archivo = una interfaz + su modelo
// (regla 11). Nombres de campo = contrato JSON de la API (camelCase, español).
//
// `rutaFactura` es una mejora sobre el legado (que traía el dato pero no lo mostraba): se usa
// para pintar el link "Ver factura" cuando viene con valor.

export interface VentaPeReporteItem {
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
  rutaFactura: string | null;
}

export class VentaPeReporteItemModel implements VentaPeReporteItem {
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
  rutaFactura: string | null;

  constructor(data: Partial<VentaPeReporteItem> = {}) {
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
    this.rutaFactura = data.rutaFactura ?? null;
  }
}
