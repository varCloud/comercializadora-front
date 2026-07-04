// Payload de alta/edición de una relación de trapeadores (POST/PUT). Un archivo = una interfaz +
// su modelo (regla 11). `valorUnidadMedida` va ya convertido (cantidad capturada / 1000), igual
// que Relación Líquidos; el back lo almacena tal cual.

export interface GuardarRelacionTrapeadorRequest {
  id: number; // 0 = alta; > 0 = edición
  idProductoMateria1: number;
  idProductoMateria2: number;
  idProductoProduccion: number;
  idUnidadMedidad: number;
  valorUnidadMedida: number;
}

export class GuardarRelacionTrapeadorRequestModel implements GuardarRelacionTrapeadorRequest {
  id: number;
  idProductoMateria1: number;
  idProductoMateria2: number;
  idProductoProduccion: number;
  idUnidadMedidad: number;
  valorUnidadMedida: number;

  constructor(data: Partial<GuardarRelacionTrapeadorRequest> = {}) {
    this.id = data.id ?? 0;
    this.idProductoMateria1 = data.idProductoMateria1 ?? 0;
    this.idProductoMateria2 = data.idProductoMateria2 ?? 0;
    this.idProductoProduccion = data.idProductoProduccion ?? 0;
    this.idUnidadMedidad = data.idUnidadMedidad ?? 0;
    this.valorUnidadMedida = data.valorUnidadMedida ?? 0;
  }
}
