// Relación de líquidos (proceso de producción): materia prima a granel → producto envasado →
// envase, con su unidad de medida y cantidad. Tal como la devuelve la API
// (SP_V2_CONSULTA_COMBINACION_LIQUIDOS). Un archivo = una interfaz + su modelo (regla 11).
// Nombres de campo = contrato JSON (camelCase), conservando los typos del esquema legado
// (idProducoEnvase, idUnidadMedidad).

export interface RelacionLiquido {
  idRelacionEnvasadoAgranel: number;
  idProductoAgranel: number;
  agranelDescripcion: string;
  idProductoEnvasado: number;
  envasadoDescripcion: string;
  idProducoEnvase: number;
  envaseDescripcion: string;
  idUnidadMedidad: number;
  unidadMedidad: string;
  valorUnidadMedida: number;
  activo: boolean;
}

export class RelacionLiquidoModel implements RelacionLiquido {
  idRelacionEnvasadoAgranel: number;
  idProductoAgranel: number;
  agranelDescripcion: string;
  idProductoEnvasado: number;
  envasadoDescripcion: string;
  idProducoEnvase: number;
  envaseDescripcion: string;
  idUnidadMedidad: number;
  unidadMedidad: string;
  valorUnidadMedida: number;
  activo: boolean;

  constructor(data: Partial<RelacionLiquido> = {}) {
    this.idRelacionEnvasadoAgranel = data.idRelacionEnvasadoAgranel ?? 0;
    this.idProductoAgranel = data.idProductoAgranel ?? 0;
    this.agranelDescripcion = data.agranelDescripcion ?? '';
    this.idProductoEnvasado = data.idProductoEnvasado ?? 0;
    this.envasadoDescripcion = data.envasadoDescripcion ?? '';
    this.idProducoEnvase = data.idProducoEnvase ?? 0;
    this.envaseDescripcion = data.envaseDescripcion ?? '';
    this.idUnidadMedidad = data.idUnidadMedidad ?? 0;
    this.unidadMedidad = data.unidadMedidad ?? '';
    this.valorUnidadMedida = data.valorUnidadMedida ?? 0;
    this.activo = data.activo ?? true;
  }
}
