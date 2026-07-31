// Existencia disponible de un producto en el almacén del usuario autenticado
// (GET /ventas/existencias, SP_V2_CONSULTA_EXISTENCIA_PRODUCTOS). Un archivo = una interfaz +
// su modelo (regla 11). El `idAlmacen` lo resuelve el backend del JWT; el front solo cruza esta
// lista contra el catálogo de productos por `idProducto` (ver `pos-catalogo.service.ts`).

export interface ExistenciaProducto {
  idProducto: number;
  /** Existencia disponible (excluye piso bloqueado/resguardo/sin-acomodar/producción a granel). */
  cantidad: number;
  /** Existencia total (excluye solo producción a granel en proceso). Réplica del "E:" del legado. */
  existenciaTotal: number;
  /** Existencia en piso "sin acomodar". Réplica del "SA:" del legado. */
  sinAcomodar: number;
  /** Existencia en piso de resguardo. Réplica del "R:" del legado. */
  resguardo: number;
  /** Existencia en piso bloqueado. Réplica del "B:" del legado. */
  bloqueo: number;
}

export class ExistenciaProductoModel implements ExistenciaProducto {
  idProducto: number;
  cantidad: number;
  existenciaTotal: number;
  sinAcomodar: number;
  resguardo: number;
  bloqueo: number;

  constructor(data: Partial<ExistenciaProducto> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.existenciaTotal = data.existenciaTotal ?? 0;
    this.sinAcomodar = data.sinAcomodar ?? 0;
    this.resguardo = data.resguardo ?? 0;
    this.bloqueo = data.bloqueo ?? 0;
  }
}
