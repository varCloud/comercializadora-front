// Payload de alta/edición de una relación de líquidos (POST/PUT). Un archivo = una interfaz +
// su modelo (regla 11). `valorUnidadMedida` va ya convertido (cantidad capturada / 1000), igual
// que el legado; el back lo almacena tal cual.

export interface GuardarRelacionLiquidoRequest {
  idRelacionEnvasadoAgranel: number; // 0 = alta; > 0 = edición
  idProductoAgranel: number;
  idProductoEnvasado: number;
  idProducoEnvase: number;
  idUnidadMedidad: number;
  valorUnidadMedida: number;
}

export class GuardarRelacionLiquidoRequestModel implements GuardarRelacionLiquidoRequest {
  idRelacionEnvasadoAgranel: number;
  idProductoAgranel: number;
  idProductoEnvasado: number;
  idProducoEnvase: number;
  idUnidadMedidad: number;
  valorUnidadMedida: number;

  constructor(data: Partial<GuardarRelacionLiquidoRequest> = {}) {
    this.idRelacionEnvasadoAgranel = data.idRelacionEnvasadoAgranel ?? 0;
    this.idProductoAgranel = data.idProductoAgranel ?? 0;
    this.idProductoEnvasado = data.idProductoEnvasado ?? 0;
    this.idProducoEnvase = data.idProducoEnvase ?? 0;
    this.idUnidadMedidad = data.idUnidadMedidad ?? 0;
    this.valorUnidadMedida = data.valorUnidadMedida ?? 0;
  }
}
