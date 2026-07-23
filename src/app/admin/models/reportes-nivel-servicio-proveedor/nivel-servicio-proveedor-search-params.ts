// Filtros de búsqueda de "Reportes > Nivel de Servicio Proveedor" — payload que consumirá el
// futuro `GET /api/reportes/nivel-servicio-proveedor` (FE-3). Un archivo = una interfaz + su
// modelo (regla 11). A diferencia de `MargenBrutoSearchParams`, aquí `fechaIni`/`fechaFin` son
// OPCIONALES (ver hu_nivel_servicio_proveedor.md: sin fechas = histórico completo, la API NO
// rechaza la solicitud) — se tipan con `?` para reflejarlo, igual que `CierrePedidosPESearchParams`.
// `page`/`perPage` también opcionales (paginación server-side pendiente de FE-3/FE-4; regla 10).

export interface NivelServicioProveedorSearchParams {
  fechaIni?: string | null;
  fechaFin?: string | null;
  page?: number;
  perPage?: number;
}

export class NivelServicioProveedorSearchParamsModel implements NivelServicioProveedorSearchParams {
  fechaIni?: string | null;
  fechaFin?: string | null;
  page?: number;
  perPage?: number;

  constructor(data: Partial<NivelServicioProveedorSearchParams> = {}) {
    this.fechaIni = data.fechaIni ?? null;
    this.fechaFin = data.fechaFin ?? null;
    this.page = data.page ?? 1;
    this.perPage = data.perPage ?? 25;
  }
}
