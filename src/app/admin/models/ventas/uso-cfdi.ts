// Uso de CFDI (catálogo SAT, GET /ventas/catalogos/uso-cfdi). Mapea 1:1 la entidad `UsoCfdi`
// de comercializadora-api. Un archivo = una interfaz + su modelo (regla 11).

export interface UsoCfdi {
  id: number;
  /** Clave SAT (p. ej. "G03"). */
  clave: string;
  descripcion: string;
}

export class UsoCfdiModel implements UsoCfdi {
  id: number;
  clave: string;
  descripcion: string;

  constructor(data: Partial<UsoCfdi> = {}) {
    this.id = data.id ?? 0;
    this.clave = data.clave ?? '';
    this.descripcion = data.descripcion ?? '';
  }
}
