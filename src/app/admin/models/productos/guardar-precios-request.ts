// Payload para guardar precios de un producto (PUT /productos/{id}/precios).
// Un archivo = una interfaz + su modelo (regla 11).

export interface RangoPrecioInput {
  min: number;
  max: number;
  costo: number;
  porcUtilidad: number;
}

export interface GuardarPreciosRequest {
  precioIndividual: number;
  precioMenudeo: number;
  ultimoCostoCompra: number | null;
  porcUtilidadIndividual: number | null;
  porcUtilidadMayoreo: number | null;
  rangos: RangoPrecioInput[];
}

export class GuardarPreciosRequestModel implements GuardarPreciosRequest {
  precioIndividual: number;
  precioMenudeo: number;
  ultimoCostoCompra: number | null;
  porcUtilidadIndividual: number | null;
  porcUtilidadMayoreo: number | null;
  rangos: RangoPrecioInput[];

  constructor(data: Partial<GuardarPreciosRequest> = {}) {
    this.precioIndividual = data.precioIndividual ?? 0;
    this.precioMenudeo = data.precioMenudeo ?? 0;
    this.ultimoCostoCompra = data.ultimoCostoCompra ?? null;
    this.porcUtilidadIndividual = data.porcUtilidadIndividual ?? null;
    this.porcUtilidadMayoreo = data.porcUtilidadMayoreo ?? null;
    this.rangos = data.rangos ?? [];
  }
}
