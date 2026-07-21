// Fila del listado de "Reportes > Margen Bruto" (paridad de campos con el contrato de la API
// descrito en hu_reporte_margen_bruto.md — back-end aún pendiente, FE-3/FE-4). `codigoBarras`
// solo viene poblado en los tipos Producto/Venta_Producto (null en Global/Línea). Un archivo =
// una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON de la API (camelCase,
// regla 09).

export interface MargenBrutoItem {
  id: number;
  descripcion: string;
  totalVentas: number;
  costoVentas: number;
  contribucionMarginal: number;
  /** Porcentaje de margen bruto (`contribucionMarginal / totalVentas * 100`, 0 si no aplica). */
  margenBruto: number;
  codigoBarras?: string | null;
}

export class MargenBrutoItemModel implements MargenBrutoItem {
  id: number;
  descripcion: string;
  totalVentas: number;
  costoVentas: number;
  contribucionMarginal: number;
  margenBruto: number;
  codigoBarras?: string | null;

  constructor(data: Partial<MargenBrutoItem> = {}) {
    this.id = data.id ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.totalVentas = data.totalVentas ?? 0;
    this.costoVentas = data.costoVentas ?? 0;
    this.contribucionMarginal = data.contribucionMarginal ?? 0;
    this.margenBruto = data.margenBruto ?? 0;
    this.codigoBarras = data.codigoBarras ?? null;
  }
}
