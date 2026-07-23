// Filtros de búsqueda de "Reportes > Drop Size" — payload que consumirá el futuro
// `GET /api/reportes/drop-size` (FE-3). Un archivo = una interfaz + su modelo (regla 11).
// `fechaIni`/`fechaFin` OPCIONALES (regla 18 estándar, igual que `dias_promedio_inventario`, a
// diferencia de `margen_bruto`): el SP_V2 defaultea a "hoy" si no se envían (ver
// hu_reporte_drop_size.md) — "Buscar" nunca se bloquea por falta de fechas. `page`/`perPage`
// quedan listos para la paginación server-side futura (FE-3/FE-4); en esta corrida (FE-1/FE-2)
// se pagina en el cliente sobre datos MOCK con `paginarCliente`.

import { TipoDropSizeId } from './tipo-drop-size';

export interface DropSizeSearchParams {
  tipo: TipoDropSizeId;
  fechaIni?: string | null;
  fechaFin?: string | null;
  page?: number;
  perPage?: number;
}

export class DropSizeSearchParamsModel implements DropSizeSearchParams {
  tipo: TipoDropSizeId;
  fechaIni?: string | null;
  fechaFin?: string | null;
  page?: number;
  perPage?: number;

  constructor(data: Partial<DropSizeSearchParams> = {}) {
    this.tipo = data.tipo ?? TipoDropSizeId.Global;
    this.fechaIni = data.fechaIni ?? null;
    this.fechaFin = data.fechaFin ?? null;
    this.page = data.page ?? 1;
    this.perPage = data.perPage ?? 25;
  }
}
