// Existencia de un producto puntual en un almacén puntual (GET /pedidos-especiales/existencia).
// Mapea 1:1 la entidad `ExistenciaProductoAlmacen` de comercializadora-api. Un archivo = una
// interfaz + su modelo (regla 09/11). `inhabilitado` ya viene calculado por la API (Cantidad
// <= 0): el front NO lo re-evalúa, igual que `PedidoEspecialProducto` (Ventas Bloque E).

export interface ExistenciaProductoAlmacen {
  idProducto: number;
  idAlmacen: number;
  descripcion: string | null;
  cantidad: number;
  /** true = sin existencia disponible; marca/deshabilita la partida en la tabla. */
  inhabilitado: boolean;
}

export class ExistenciaProductoAlmacenModel implements ExistenciaProductoAlmacen {
  idProducto: number;
  idAlmacen: number;
  descripcion: string | null;
  cantidad: number;
  inhabilitado: boolean;

  constructor(data: Partial<ExistenciaProductoAlmacen> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.idAlmacen = data.idAlmacen ?? 0;
    this.descripcion = data.descripcion ?? null;
    this.cantidad = data.cantidad ?? 0;
    this.inhabilitado = data.inhabilitado ?? false;
  }
}
