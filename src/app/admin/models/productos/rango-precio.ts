// Rango de precio por volumen ("mayoreo") de un producto. Un archivo = una interfaz + su modelo.

export interface RangoPrecio {
  contador: number;
  idProducto: number;
  min: number;
  max: number;
  costo: number;
  porcUtilidad: number;
}

export class RangoPrecioModel implements RangoPrecio {
  contador: number;
  idProducto: number;
  min: number;
  max: number;
  costo: number;
  porcUtilidad: number;

  constructor(data: Partial<RangoPrecio> = {}) {
    this.contador = data.contador ?? 0;
    this.idProducto = data.idProducto ?? 0;
    this.min = data.min ?? 0;
    this.max = data.max ?? 0;
    this.costo = data.costo ?? 0;
    this.porcUtilidad = data.porcUtilidad ?? 0;
  }
}
