// Fila del listado de "Reportes > Drop Size" (tamaño promedio de venta por cliente/factura, en
// monto y en cantidad de productos). Migra `Models/DropSize.cs` del legado. Columnas 1:1 con
// `_DropSize.cshtml`: Id, Descripcion, Codigo de Barras, Total de Clientes, Total de Ventas,
// Total de Productos, DropSize Ventas, DropSize Cantidad. `codigoBarras` solo viene poblado en
// el tipo Producto (null en Global/Línea). Un archivo = una interfaz + su modelo (regla 11).
// Nombres de campo = contrato JSON esperado de la API (camelCase, regla 09) — back-end aún
// pendiente (FE-3/FE-4), ver hu_reporte_drop_size.md.

export interface DropSizeItem {
  id: number;
  descripcion: string;
  codigoBarras?: string | null;
  totalClientes: number;
  totalVentas: number;
  totalProductos: number;
  dropSizeVentas: number;
  dropSizeCantidad: number;
}

export class DropSizeItemModel implements DropSizeItem {
  id: number;
  descripcion: string;
  codigoBarras?: string | null;
  totalClientes: number;
  totalVentas: number;
  totalProductos: number;
  dropSizeVentas: number;
  dropSizeCantidad: number;

  constructor(data: Partial<DropSizeItem> = {}) {
    this.id = data.id ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.codigoBarras = data.codigoBarras ?? null;
    this.totalClientes = data.totalClientes ?? 0;
    this.totalVentas = data.totalVentas ?? 0;
    this.totalProductos = data.totalProductos ?? 0;
    this.dropSizeVentas = data.dropSizeVentas ?? 0;
    this.dropSizeCantidad = data.dropSizeCantidad ?? 0;
  }
}
