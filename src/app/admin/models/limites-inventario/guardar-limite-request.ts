// Payload para crear/actualizar el límite mín/máx de un producto en un almacén (PATCH).
// El idUsuario lo toma la API del JWT, no viaja aquí. Regla 09.
export interface GuardarLimiteRequest {
  idProducto: number;
  idAlmacen: number;
  minimo: number;
  maximo: number;
}

export class GuardarLimiteRequestModel implements GuardarLimiteRequest {
  idProducto: number;
  idAlmacen: number;
  minimo: number;
  maximo: number;

  constructor(data: Partial<GuardarLimiteRequest> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.idAlmacen = data.idAlmacen ?? 0;
    this.minimo = data.minimo ?? 0;
    this.maximo = data.maximo ?? 0;
  }
}
