// Filtros de búsqueda de "Reportes > Días Promedio Inventario" — payload que consumirá el futuro
// `GET /api/reportes/dias-promedio-inventario` (FE-3). Un archivo = una interfaz + su modelo
// (regla 11). A diferencia de `MargenBrutoSearchParams`, aquí `fechaIni`/`fechaFin` son
// OPCIONALES (regla 18 estándar): el legado defaultea a "hoy" si no se envían y el nuevo SP_V2
// conserva ese comportamiento (ver hu_reporte_dias_promedio_inventario.md) — el botón "Buscar"
// NO se bloquea por falta de fechas. `page`/`perPage` sí aplican (paginación server-side,
// decisión de la HU pese al volumen bajo).

import { TipoDiasPromedioInventarioId } from './tipo-dias-promedio-inventario';

export interface DiasPromedioInventarioSearchParams {
  tipo: TipoDiasPromedioInventarioId;
  fechaIni?: string | null;
  fechaFin?: string | null;
  page?: number;
  perPage?: number;
}

export class DiasPromedioInventarioSearchParamsModel implements DiasPromedioInventarioSearchParams {
  tipo: TipoDiasPromedioInventarioId;
  fechaIni?: string | null;
  fechaFin?: string | null;
  page?: number;
  perPage?: number;

  constructor(data: Partial<DiasPromedioInventarioSearchParams> = {}) {
    this.tipo = data.tipo ?? TipoDiasPromedioInventarioId.Global;
    this.fechaIni = data.fechaIni ?? null;
    this.fechaFin = data.fechaFin ?? null;
    this.page = data.page ?? 1;
    this.perPage = data.perPage ?? 25;
  }
}
