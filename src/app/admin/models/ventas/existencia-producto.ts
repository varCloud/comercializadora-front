// Existencia disponible de un producto en el almacén del usuario autenticado
// (GET /ventas/existencias, SP_V2_CONSULTA_EXISTENCIA_PRODUCTOS). Un archivo = una interfaz +
// su modelo (regla 11). El `idAlmacen` lo resuelve el backend del JWT; el front solo cruza esta
// lista contra el catálogo de productos por `idProducto` (ver `pos-catalogo.service.ts`).

export interface ExistenciaProducto {
  idProducto: number;
  /** Existencia disponible (excluye piso bloqueado/resguardo/sin-acomodar/producción a granel). */
  cantidad: number;
}

export class ExistenciaProductoModel implements ExistenciaProducto {
  idProducto: number;
  cantidad: number;

  constructor(data: Partial<ExistenciaProducto> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.cantidad = data.cantidad ?? 0;
  }
}
