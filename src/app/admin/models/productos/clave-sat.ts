// Clave de Producto/Servicio del SAT (búsqueda servidor para el ng-select del formulario).
// El producto guarda la cadena `claveProdServ`, no el id. Un archivo = una interfaz + su modelo.

export interface ClaveSat {
  id: number;
  claveProdServ: string;
  descripcion: string;
  /** Etiqueta visible en el selector: "clave - descripción". */
  etiqueta: string;
}

export class ClaveSatModel implements ClaveSat {
  id: number;
  claveProdServ: string;
  descripcion: string;
  etiqueta: string;

  constructor(data: Partial<ClaveSat> = {}) {
    this.id = data.id ?? 0;
    this.claveProdServ = data.claveProdServ ?? '';
    this.descripcion = data.descripcion ?? '';
    this.etiqueta = this.descripcion
      ? `${this.claveProdServ} - ${this.descripcion}`
      : this.claveProdServ;
  }
}
