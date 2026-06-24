// Payload de alta/edición de línea de producto (POST /lineas-producto, PUT /lineas-producto/{id}).
// Un archivo = una interfaz + su modelo (regla 11).

export interface GuardarLineaProductoRequest {
  idLineaProducto: number;
  descripcion: string;
  activo: boolean;
}

export class GuardarLineaProductoRequestModel implements GuardarLineaProductoRequest {
  idLineaProducto: number;
  descripcion: string;
  activo: boolean;

  constructor(data: Partial<GuardarLineaProductoRequest> = {}) {
    this.idLineaProducto = data.idLineaProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.activo = data.activo ?? true;
  }
}
