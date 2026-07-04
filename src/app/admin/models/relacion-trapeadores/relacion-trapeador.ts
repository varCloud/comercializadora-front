// Relación de trapeadores (proceso de producción): materia prima/matra + bastón → trapeador a
// fabricar, con su unidad de medida y cantidad. Tal como la devuelve la API
// (api/relacion-trapeadores). Un archivo = una interfaz + su modelo (regla 11).
// Nombres de campo = contrato JSON (camelCase), mismo shape que la API.

export interface RelacionTrapeador {
  id: number;
  idProductoMateria1: number;
  productoMateria1Descripcion: string;
  idProductoMateria2: number;
  productoMateria2Descripcion: string;
  idProductoProduccion: number;
  productoProduccionDescripcion: string;
  idUnidadMedidad: number;
  unidadMedidad: string;
  valorUnidadMedida: number;
  activo: boolean;
}

export class RelacionTrapeadorModel implements RelacionTrapeador {
  id: number;
  idProductoMateria1: number;
  productoMateria1Descripcion: string;
  idProductoMateria2: number;
  productoMateria2Descripcion: string;
  idProductoProduccion: number;
  productoProduccionDescripcion: string;
  idUnidadMedidad: number;
  unidadMedidad: string;
  valorUnidadMedida: number;
  activo: boolean;

  constructor(data: Partial<RelacionTrapeador> = {}) {
    this.id = data.id ?? 0;
    this.idProductoMateria1 = data.idProductoMateria1 ?? 0;
    this.productoMateria1Descripcion = data.productoMateria1Descripcion ?? '';
    this.idProductoMateria2 = data.idProductoMateria2 ?? 0;
    this.productoMateria2Descripcion = data.productoMateria2Descripcion ?? '';
    this.idProductoProduccion = data.idProductoProduccion ?? 0;
    this.productoProduccionDescripcion = data.productoProduccionDescripcion ?? '';
    this.idUnidadMedidad = data.idUnidadMedidad ?? 0;
    this.unidadMedidad = data.unidadMedidad ?? '';
    this.valorUnidadMedida = data.valorUnidadMedida ?? 0;
    this.activo = data.activo ?? true;
  }
}
