// Tipo de agregación del reporte Drop Size (mapea el parámetro del selector "Tipo de DropSize"
// de `DropSize.cshtml`/`evtReporteDropSize.js` en el legado: Global/Línea/Producto). Catálogo
// fijo de 3 valores → mat-select (regla 16, ≤10 opciones). El legado reusa `EnumTipoMargenBruto`,
// que declara un 4º valor (`4 = Venta_Producto`) que el selector de Drop Size no expone: código
// muerto, no se migra (ver hu_reporte_drop_size.md, mismo criterio que dias_promedio_inventario).

import { Catalogo } from 'src/app/admin/models/shared/catalogo';

export enum TipoDropSizeId {
  Global = 1,
  Linea = 2,
  Producto = 3,
}

/** Opciones del filtro "Tipo de DropSize" (mat-select, 3 opciones → regla 16). Siempre obligatorio. */
export const TIPO_DROP_SIZE_OPTIONS: Catalogo[] = [
  { id: TipoDropSizeId.Global, descripcion: 'Global' },
  { id: TipoDropSizeId.Linea, descripcion: 'Línea' },
  { id: TipoDropSizeId.Producto, descripcion: 'Producto' },
];

/** Tipos cuyas filas incluyen `codigoBarras` poblado (solo Producto) — mismo criterio que los
 * sub-reportes hermanos `margen_bruto`/`dias_promedio_inventario`. */
export const TIPOS_DROP_SIZE_CON_CODIGO_BARRAS: ReadonlySet<TipoDropSizeId> = new Set([
  TipoDropSizeId.Producto,
]);
