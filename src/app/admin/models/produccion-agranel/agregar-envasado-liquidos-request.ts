// Payload del registro de envasado de líquidos (POST /api/produccion-agranel/envasado):
// convierte líquido a granel en producto envasado según la relación envasado↔granel vigente.
// El idUsuario NO viaja en el body: la API lo toma del JWT. Regla 11: interfaz + modelo.

export interface AgregarEnvasadoLiquidosRequest {
  idProducto: number;
  cantidad: number;
  idAlmacen: number;
}

export class AgregarEnvasadoLiquidosRequestModel implements AgregarEnvasadoLiquidosRequest {
  idProducto: number;
  cantidad: number;
  idAlmacen: number;

  constructor(data: Partial<AgregarEnvasadoLiquidosRequest> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.idAlmacen = data.idAlmacen ?? 0;
  }
}
