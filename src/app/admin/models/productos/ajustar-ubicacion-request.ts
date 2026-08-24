// Payload para ajustar el inventario físico de una ubicación puntual de un producto
// (PATCH /productos/{id}/ubicaciones/{idUbicacion}). Un archivo = una interfaz + su modelo
// (regla 11). Origen legado: modal `_UbicacionesProducto.cshtml` + `EvtProductos.js::AjustarInventarioProducto`.

export interface AjustarUbicacionRequest {
  cantidadEnFisico: number;
  errorHumano: boolean;
}

export class AjustarUbicacionRequestModel implements AjustarUbicacionRequest {
  cantidadEnFisico: number;
  errorHumano: boolean;

  constructor(data: Partial<AjustarUbicacionRequest> = {}) {
    this.cantidadEnFisico = data.cantidadEnFisico ?? 0;
    this.errorHumano = data.errorHumano ?? false;
  }
}
