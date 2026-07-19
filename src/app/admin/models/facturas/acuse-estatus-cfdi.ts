// Respuesta de POST /api/facturas/estatus-cancelacion (consulta al SAT). Un archivo = una
// interfaz + su modelo (regla 11).

export interface AcuseEstatusCfdi {
  codigoEstatus: string | null;
  esCancelable: string | null;
  estado: string | null;
  estatusCancelacion: string | null;
  validacionEfos: string | null;
}

export class AcuseEstatusCfdiModel implements AcuseEstatusCfdi {
  codigoEstatus: string | null;
  esCancelable: string | null;
  estado: string | null;
  estatusCancelacion: string | null;
  validacionEfos: string | null;

  constructor(data: Partial<AcuseEstatusCfdi> = {}) {
    this.codigoEstatus = data.codigoEstatus ?? null;
    this.esCancelable = data.esCancelable ?? null;
    this.estado = data.estado ?? null;
    this.estatusCancelacion = data.estatusCancelacion ?? null;
    this.validacionEfos = data.validacionEfos ?? null;
  }
}
