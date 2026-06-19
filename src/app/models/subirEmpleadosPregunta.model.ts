export interface EmpleadosPregunta {
  numUsuario: number;
  nombreCompleto: string;
}

export interface SubirEmpleadosPregunta {
  idEvaluacion: number;
  empleados: EmpleadosPregunta[];
}

export class EmpleadosPreguntaModel implements EmpleadosPregunta {
  numUsuario: number;
  nombreCompleto: string;

  constructor(data: any) {
    this.numUsuario = data?.numUsuario || 0;
    this.nombreCompleto = data?.nombreCompleto || '';
  }
}

export class SubirEmpleadosPreguntaModel implements SubirEmpleadosPregunta {
  idEvaluacion: number;
  empleados: EmpleadosPregunta[];

  constructor(data: any) {
    this.idEvaluacion = data?.idEvaluacion || 0;
    this.empleados = data?.empleados.map((e: any) => new EmpleadosPreguntaModel(e)) || [];
  }
}