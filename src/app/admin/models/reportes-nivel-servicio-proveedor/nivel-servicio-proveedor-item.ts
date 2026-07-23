// Fila del listado de "Reportes > Nivel de Servicio Proveedor" (paridad de campos con el
// contrato de la API descrito en hu_nivel_servicio_proveedor.md — back-end aún pendiente,
// FE-3/FE-4). Mismas métricas que el catálogo de Proveedores (`SP_V2_CONSULTA_PROVEEDORES`)
// pero acotadas por rango de fechas y con DTO propio (no se reutiliza la entidad `Proveedor`
// del catálogo, ver HU). Un archivo = una interfaz + su modelo (regla 11). Nombres de campo =
// contrato JSON de la API (camelCase, regla 09).

export interface NivelServicioProveedorItem {
  idProveedor: number;
  nombre: string;
  totalPedidosCompletos: number;
  totalPedidosIncompletos: number;
  totalPedidosTotales: number;
  /** Porcentaje de pedidos atendidos (`(1 - incompletos/totales) * 100`, 0 si totales = 0). */
  porcAtendido: number;
}

export class NivelServicioProveedorItemModel implements NivelServicioProveedorItem {
  idProveedor: number;
  nombre: string;
  totalPedidosCompletos: number;
  totalPedidosIncompletos: number;
  totalPedidosTotales: number;
  porcAtendido: number;

  constructor(data: Partial<NivelServicioProveedorItem> = {}) {
    this.idProveedor = data.idProveedor ?? 0;
    this.nombre = data.nombre ?? '';
    this.totalPedidosCompletos = data.totalPedidosCompletos ?? 0;
    this.totalPedidosIncompletos = data.totalPedidosIncompletos ?? 0;
    this.totalPedidosTotales = data.totalPedidosTotales ?? 0;
    this.porcAtendido = data.porcAtendido ?? 0;
  }
}
