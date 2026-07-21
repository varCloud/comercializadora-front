// Tipo de agregación del reporte de Días Promedio Inventario (mapea el parámetro legado
// `@idTipoInventarioPromedio` de `SP_INDICADOR_DIAS_PROMEDIO_INVENTARIO`: Global/Línea/Producto).
// Catálogo fijo de 3 valores → mat-select (regla 16, ≤10 opciones). El legado declara un 4º
// valor (`4 = productoVenta`) en el comentario del parámetro, pero ningún bloque `if` del SP lo
// maneja: es código muerto, no se migra (ver hu_reporte_dias_promedio_inventario.md). A
// diferencia de margen_bruto (donde el filtro "Tipo" es obligatorio), aquí también siempre hay
// un valor seleccionado (no existe opción "--Todos--"), mismo criterio.

import { Catalogo } from 'src/app/admin/models/shared/catalogo';

export enum TipoDiasPromedioInventarioId {
  Global = 1,
  Linea = 2,
  Producto = 3,
}

/** Opciones del filtro "Tipo" (mat-select, 3 opciones → regla 16). Siempre obligatorio. */
export const TIPO_DIAS_PROMEDIO_INVENTARIO_OPTIONS: Catalogo[] = [
  { id: TipoDiasPromedioInventarioId.Global, descripcion: 'Global' },
  { id: TipoDiasPromedioInventarioId.Linea, descripcion: 'Línea' },
  { id: TipoDiasPromedioInventarioId.Producto, descripcion: 'Producto' },
];

/** Tipos cuyas filas incluyen `codigoBarras` poblado (solo Producto). */
export const TIPOS_DIAS_PROMEDIO_INVENTARIO_CON_CODIGO_BARRAS: ReadonlySet<TipoDiasPromedioInventarioId> =
  new Set([TipoDiasPromedioInventarioId.Producto]);
