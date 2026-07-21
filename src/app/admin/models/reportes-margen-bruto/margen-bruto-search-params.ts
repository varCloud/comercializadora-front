// Filtros de búsqueda de "Reportes > Margen Bruto" — payload que consumirá el futuro
// `GET /api/reportes/margen-bruto` (FE-3). Un archivo = una interfaz + su modelo (regla 11).
// A diferencia de otros reportes hermanos (ver `CierrePedidosPESearchParams`), aquí `tipo`,
// `fechaIni` y `fechaFin` son OBLIGATORIOS (ver hu_reporte_margen_bruto.md: la API rechaza la
// solicitud con 400 si falta alguno) — se tipan sin `?` para reflejarlo, aunque el modelo
// aplica un default best-effort en el constructor por si se instancia antes de tener los tres.
// `page`/`perPage` sí son opcionales (paginación server-side de los 4 tipos, regla 10).

import { TipoMargenBrutoId } from './tipo-margen-bruto';

export interface MargenBrutoSearchParams {
  tipo: TipoMargenBrutoId;
  fechaIni: string;
  fechaFin: string;
  page?: number;
  perPage?: number;
}

export class MargenBrutoSearchParamsModel implements MargenBrutoSearchParams {
  tipo: TipoMargenBrutoId;
  fechaIni: string;
  fechaFin: string;
  page?: number;
  perPage?: number;

  constructor(data: Partial<MargenBrutoSearchParams> = {}) {
    this.tipo = data.tipo ?? TipoMargenBrutoId.Global;
    this.fechaIni = data.fechaIni ?? '';
    this.fechaFin = data.fechaFin ?? '';
    this.page = data.page ?? 1;
    this.perPage = data.perPage ?? 25;
  }
}
