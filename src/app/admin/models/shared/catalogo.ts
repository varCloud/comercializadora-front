// Ítem genérico de catálogo (Roles, Sucursales, Almacenes…) para poblar combos.
// Transversal a features → vive en admin/models/shared/ (regla 11).

export interface Catalogo {
  id: number;
  descripcion: string;
}

export class CatalogoModel implements Catalogo {
  id: number;
  descripcion: string;

  constructor(data: Partial<Catalogo> = {}) {
    this.id = data.id ?? 0;
    this.descripcion = data.descripcion ?? '';
  }
}
