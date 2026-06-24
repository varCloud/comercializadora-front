// Categoría de ventas tal como la devuelve la API (KPIs / ventas-por-fecha).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON español.

export interface Categoria {
  id: number;
  categoria: string;
  total: number;
  totalPE: number;
  fechaIni: string;
  fechaFin: string;
}

export class CategoriaModel implements Categoria {
  id: number;
  categoria: string;
  total: number;
  totalPE: number;
  fechaIni: string;
  fechaFin: string;

  constructor(data: Partial<Categoria> = {}) {
    this.id = data.id ?? 0;
    this.categoria = data.categoria ?? '';
    this.total = data.total ?? 0;
    this.totalPE = data.totalPE ?? 0;
    this.fechaIni = data.fechaIni ?? '';
    this.fechaFin = data.fechaFin ?? '';
  }
}
