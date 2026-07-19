// Payload del alta de producto MPL a producción a granel (POST /api/produccion-agranel).
// El idUsuario NO viaja en el body: la API lo toma del JWT. Regla 11: interfaz + modelo.

export interface AgregarProduccionAgranelRequest {
  idProducto: number;
  cantidad: number;
  idAlmacen: number;
}

export class AgregarProduccionAgranelRequestModel implements AgregarProduccionAgranelRequest {
  idProducto: number;
  cantidad: number;
  idAlmacen: number;

  constructor(data: Partial<AgregarProduccionAgranelRequest> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.idAlmacen = data.idAlmacen ?? 0;
  }
}
