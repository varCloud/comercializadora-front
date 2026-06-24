// Fila de la previsualización del Excel en el diálogo de importación: los 4 campos del
// archivo + el resultado de la validación en cliente (valido/mensaje). Regla 09/11.
export interface LimiteExcelRow {
  codigoBarras: string;
  descripcionAlmacen: string;
  minimo: number;
  maximo: number;
  valido: boolean;
  mensaje: string;
}

export class LimiteExcelRowModel implements LimiteExcelRow {
  codigoBarras: string;
  descripcionAlmacen: string;
  minimo: number;
  maximo: number;
  valido: boolean;
  mensaje: string;

  constructor(data: Partial<LimiteExcelRow> = {}) {
    this.codigoBarras = data.codigoBarras ?? '';
    this.descripcionAlmacen = data.descripcionAlmacen ?? '';
    this.minimo = data.minimo ?? 0;
    this.maximo = data.maximo ?? 0;
    this.valido = data.valido ?? false;
    this.mensaje = data.mensaje ?? '';
  }
}
