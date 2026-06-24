// Precios de un producto: base (tabla Productos) + rangos de mayoreo. Un archivo = interfaz + modelo.
// Nota: los nombres de campo son los del legado; la ETIQUETA correcta va en el front
// (precioIndividual = "Precio Menudeo", precioMenudeo = "Precio Mayoreo").

import { RangoPrecio, RangoPrecioModel } from './rango-precio';

export interface PreciosProducto {
  precioIndividual: number | null;
  precioMenudeo: number | null;
  ultimoCostoCompra: number | null;
  porcUtilidadIndividual: number | null;
  porcUtilidadMayoreo: number | null;
  rangos: RangoPrecio[];
}

export class PreciosProductoModel implements PreciosProducto {
  precioIndividual: number | null;
  precioMenudeo: number | null;
  ultimoCostoCompra: number | null;
  porcUtilidadIndividual: number | null;
  porcUtilidadMayoreo: number | null;
  rangos: RangoPrecio[];

  constructor(data: Partial<PreciosProducto> = {}) {
    this.precioIndividual = data.precioIndividual ?? null;
    this.precioMenudeo = data.precioMenudeo ?? null;
    this.ultimoCostoCompra = data.ultimoCostoCompra ?? null;
    this.porcUtilidadIndividual = data.porcUtilidadIndividual ?? null;
    this.porcUtilidadMayoreo = data.porcUtilidadMayoreo ?? null;
    this.rangos = (data.rangos ?? []).map((r) => new RangoPrecioModel(r));
  }
}
