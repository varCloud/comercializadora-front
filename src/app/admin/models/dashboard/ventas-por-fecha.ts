// Ventas por fecha tal como las devuelve la API (dashboard/ventas-por-fecha).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON español.

import { Categoria, CategoriaModel } from './categoria';

export interface VentasPorFecha {
  categorias: Categoria[];
}

export class VentasPorFechaModel implements VentasPorFecha {
  categorias: Categoria[];

  constructor(data: Partial<VentasPorFecha> = {}) {
    this.categorias = (data.categorias ?? []).map((c) => new CategoriaModel(c));
  }
}
