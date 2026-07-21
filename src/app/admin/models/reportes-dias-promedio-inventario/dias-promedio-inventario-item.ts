// Fila del listado de "Reportes > Días Promedio Inventario" (paridad de campos con el contrato
// de la API descrito en hu_reporte_dias_promedio_inventario.md — back-end aún pendiente,
// FE-3/FE-4). Migra `Models/DiasPromedioInventario.cs` del legado, sin `TotalVentas` (no se usa
// en la query del SP legado ni se pinta en la tabla, fuera de alcance). `codigoBarras` solo
// viene poblado en el tipo Producto (null en Global/Línea). Un archivo = una interfaz + su
// modelo (regla 11). Nombres de campo = contrato JSON de la API (camelCase, regla 09).

export interface DiasPromedioInventarioItem {
  id: number;
  descripcion: string;
  costoProducto: number;
  /** Promedio de `inventarioFinal` diario en el periodo consultado. */
  inventarioPromedioPeriodo: number;
  /** `costoProducto * inventarioPromedioPeriodo`. */
  costoInvPromedio: number;
  diasPeriodo: number;
  costoVendido: number;
  /** `costoInvPromedio * diasPeriodo / costoVendido` (0 si `costoVendido = 0`). */
  diasPromedioInventario: number;
  /** `diasPeriodo / diasPromedioInventario` (0 si `diasPromedioInventario = 0`). */
  rotacionInventario: number;
  codigoBarras?: string | null;
}

export class DiasPromedioInventarioItemModel implements DiasPromedioInventarioItem {
  id: number;
  descripcion: string;
  costoProducto: number;
  inventarioPromedioPeriodo: number;
  costoInvPromedio: number;
  diasPeriodo: number;
  costoVendido: number;
  diasPromedioInventario: number;
  rotacionInventario: number;
  codigoBarras?: string | null;

  constructor(data: Partial<DiasPromedioInventarioItem> = {}) {
    this.id = data.id ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.costoProducto = data.costoProducto ?? 0;
    this.inventarioPromedioPeriodo = data.inventarioPromedioPeriodo ?? 0;
    this.costoInvPromedio = data.costoInvPromedio ?? 0;
    this.diasPeriodo = data.diasPeriodo ?? 0;
    this.costoVendido = data.costoVendido ?? 0;
    this.diasPromedioInventario = data.diasPromedioInventario ?? 0;
    this.rotacionInventario = data.rotacionInventario ?? 0;
    this.codigoBarras = data.codigoBarras ?? null;
  }
}
