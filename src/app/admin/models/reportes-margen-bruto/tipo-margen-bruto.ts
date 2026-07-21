// Tipo de agregación del reporte de Margen Bruto (mapea `EnumTipoMargenBruto` del legado:
// Global/Línea/Producto/Venta_Producto). Catálogo fijo de 4 valores → mat-select (regla 16,
// ≤10 opciones): no hay endpoint dedicado, mismo patrón que
// `models/reportes-devolucion/tipo-ticket.ts`. A diferencia de ese catálogo, aquí el filtro
// "Tipo" SÍ es obligatorio (siempre hay un valor seleccionado, no existe opción "--Todos--").

import { Catalogo } from 'src/app/admin/models/shared/catalogo';

export enum TipoMargenBrutoId {
  Global = 1,
  Linea = 2,
  Producto = 3,
  VentaProducto = 4,
}

/** Opciones del filtro "Tipo" (mat-select, 4 opciones → regla 16). Siempre obligatorio. */
export const TIPO_MARGEN_BRUTO_OPTIONS: Catalogo[] = [
  { id: TipoMargenBrutoId.Global, descripcion: 'Global' },
  { id: TipoMargenBrutoId.Linea, descripcion: 'Línea' },
  { id: TipoMargenBrutoId.Producto, descripcion: 'Producto' },
  { id: TipoMargenBrutoId.VentaProducto, descripcion: 'Venta-Producto' },
];

/** Tipos cuyas filas incluyen `codigoBarras` poblado (Producto/Venta_Producto). */
export const TIPOS_MARGEN_BRUTO_CON_CODIGO_BARRAS: ReadonlySet<TipoMargenBrutoId> = new Set([
  TipoMargenBrutoId.Producto,
  TipoMargenBrutoId.VentaProducto,
]);
