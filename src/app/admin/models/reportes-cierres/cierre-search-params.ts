// Filtros de búsqueda de "Reportes > Cierres de Caja" — payload del futuro
// `POST /api/reportes/cierres/buscar` (FE-5). Un archivo = una interfaz + su modelo (regla 11).
// Si `idAlmacen` = 0 ("TODOS") no se filtra por almacén; si `idUsuario` es null no se filtra por
// usuario; `fechaIni`/`fechaFin` son inclusivos (ver hu_cierres_caja.md).

export interface CierreSearchParams {
  idAlmacen?: number | null;
  idUsuario?: number | null;
  fechaIni?: string | null;
  fechaFin?: string | null;
}

export class CierreSearchParamsModel implements CierreSearchParams {
  idAlmacen?: number | null;
  idUsuario?: number | null;
  fechaIni?: string | null;
  fechaFin?: string | null;

  constructor(data: Partial<CierreSearchParams> = {}) {
    this.idAlmacen = data.idAlmacen ?? null;
    this.idUsuario = data.idUsuario ?? null;
    this.fechaIni = data.fechaIni ?? null;
    this.fechaFin = data.fechaFin ?? null;
  }
}
