// Filtros de búsqueda de "Reportes > Cierres de Pedidos Especiales" — payload de
// `POST /api/reportes/cierres-pe/buscar` (FE-2). Un archivo = una interfaz + su modelo
// (regla 11). Todos los filtros son opcionales (AND entre los presentes): si `idUsuario` es
// null no se filtra por usuario; `fechaIni`/`fechaFin` null = sin filtro de fecha. A diferencia
// de `CierreSearchParams` (Cierres de Caja), **no** incluye `idAlmacen`: no existe en el legado
// de Pedidos Especiales (decisión de la HU, ver hu_reporte_cierres_pe.md).

export interface CierrePedidosPESearchParams {
  idUsuario?: number | null;
  fechaIni?: string | null;
  fechaFin?: string | null;
}

export class CierrePedidosPESearchParamsModel implements CierrePedidosPESearchParams {
  idUsuario?: number | null;
  fechaIni?: string | null;
  fechaFin?: string | null;

  constructor(data: Partial<CierrePedidosPESearchParams> = {}) {
    this.idUsuario = data.idUsuario ?? null;
    this.fechaIni = data.fechaIni ?? null;
    this.fechaFin = data.fechaFin ?? null;
  }
}
