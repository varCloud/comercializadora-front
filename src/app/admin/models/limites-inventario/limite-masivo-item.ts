// Ítem de la carga masiva (una fila del Excel parseado en el front). Regla 09/11.
export interface LimiteMasivoItem {
  codigoBarras: string;
  descripcionAlmacen: string;
  minimo: number;
  maximo: number;
}

export class LimiteMasivoItemModel implements LimiteMasivoItem {
  codigoBarras: string;
  descripcionAlmacen: string;
  minimo: number;
  maximo: number;

  constructor(data: Partial<LimiteMasivoItem> = {}) {
    this.codigoBarras = data.codigoBarras ?? '';
    this.descripcionAlmacen = data.descripcionAlmacen ?? '';
    this.minimo = data.minimo ?? 0;
    this.maximo = data.maximo ?? 0;
  }
}
