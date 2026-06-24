// Línea de producto tal como la devuelve la API (listado / por id).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON español.

export interface LineaProducto {
  idLineaProducto: number;
  descripcion: string;
  activo: boolean;
}

export class LineaProductoModel implements LineaProducto {
  idLineaProducto: number;
  descripcion: string;
  activo: boolean;

  constructor(data: Partial<LineaProducto> = {}) {
    this.idLineaProducto = data.idLineaProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.activo = data.activo ?? true;
  }
}
