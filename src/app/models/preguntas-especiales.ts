
export interface Evaluacion {
  descripcion: string;
  idEvaluacion: number;
  periodo: string;
}

export class EvaluacionModel implements Evaluacion {
  descripcion: string;
  idEvaluacion: number;
  periodo: string;

  constructor(data: any) {
    this.descripcion = data?.descripcion || '';
    this.idEvaluacion = data?.idEvaluacion || 0;
    this.periodo = data?.periodo || '';
  }
}

export interface PreguntaEspecial {
  cantidadEmpleados: number;
  idEvaluacion: number;
  Evaluacion: Evaluacion;
}

export class PreguntaEspecialModel implements PreguntaEspecial {
  cantidadEmpleados: number;
  idEvaluacion: number;
  Evaluacion: Evaluacion;

  constructor(data: any) {
    this.cantidadEmpleados = data?.cantidadEmpleados || 0;
    this.idEvaluacion = data?.idEvaluacion || 0;
    this.Evaluacion = data?.evaluacion || new EvaluacionModel({});
  }
}