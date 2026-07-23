// Filtros de búsqueda de "Reportes > Devoluciones a Proveedor" — payload que consumirá el
// futuro `GET /api/reportes/devoluciones-proveedor` (FE-3). Un archivo = una interfaz + su
// modelo (regla 11). `idProveedor` OPCIONAL (0/null = todos los proveedores, ver
// hu_reporte_devoluciones_proveedor.md). `fechaIni`/`fechaFin` OPCIONALES a nivel de tipo
// (regla 18 ESTÁNDAR, sin excepción — a diferencia de `NivelServicioProveedorSearchParams`,
// que sí documentó una excepción sin default): el formulario siempre arranca con hoy/hoy
// visible y "Limpiar" restaura ese mismo default, nunca los deja vacíos. `page`/`perPage`
// listos para la paginación server-side futura (FE-3/FE-4); en esta corrida (FE-1/FE-2) se
// pagina en el cliente sobre datos MOCK con `paginarCliente`.

export interface DevolucionProveedorSearchParams {
  idProveedor?: number | null;
  fechaIni?: string | null;
  fechaFin?: string | null;
  page?: number;
  perPage?: number;
}

export class DevolucionProveedorSearchParamsModel implements DevolucionProveedorSearchParams {
  idProveedor?: number | null;
  fechaIni?: string | null;
  fechaFin?: string | null;
  page?: number;
  perPage?: number;

  constructor(data: Partial<DevolucionProveedorSearchParams> = {}) {
    this.idProveedor = data.idProveedor ?? null;
    this.fechaIni = data.fechaIni ?? null;
    this.fechaFin = data.fechaFin ?? null;
    this.page = data.page ?? 1;
    this.perPage = data.perPage ?? 25;
  }
}
