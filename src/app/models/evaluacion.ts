
import { roundDecimal } from "../utils/functions";
import { EvaluacionModel } from "./evaluaciones";
import { EvaluacionAsignacion, EvaluacionAsignacionModel } from "./evaluaciones-asignacion";
import { UserCustomModel } from "./user-custom.model";

export interface Respuesta {
  id?: number;
  idEvaluacionAsignacion: number;
  idPregunta?: number; // ID de la pregunta específica (Gerencial, KPI, Objetivo, Organizacional, VinculadaPuesto)
  nivelAlcanzado?: string; // Aplica para preguntas gerenciales, organizacionales y vinculadas al puesto
  valor?: number; // Aplica para preguntas gerenciales, organizacionales y vinculadas al puesto
  valorPonderado: number;
  observaciones?: string;
  descripcionMeta?: string; // Aplica para KPI
  metaAlcanzada?: number; // Aplica para KPI
  descripcionResultado?: string; // Aplica para objetivos
  porcentajeLogradoObjetivo?: number; // Aplica para objetivos
}

export class respuestaModel implements Respuesta {
  id?: number
  idEvaluacionAsignacion: number
  idPregunta?: number
  nivelAlcanzado?: string
  valor?: number
  valorPonderado: number
  observaciones?: string
  descripcionMeta?: string
  metaAlcanzada?: number
  descripcionResultado?: string
  porcentajeLogradoObjetivo?: number
  porcentajeLogrado?: number

  constructor(data?: any) {
 
    this.id = data?.id ?? this.getIdRespuesta(data) ?? this.id
    this.idEvaluacionAsignacion = data?.idEvaluacionAsignacion ?? this.idEvaluacionAsignacion
    this.idPregunta = data?.idPregunta ?? this.idPregunta
    this.nivelAlcanzado = data?.nivelAlcanzado ?? this.nivelAlcanzado
    this.valor = data?.valor ?? this.valor
    this.valorPonderado = data?.valorPonderado ? data.valorPonderado : this.valorPonderado
    this.observaciones = data?.observaciones ?? this.observaciones
    this.descripcionMeta = data?.descripcionMeta ?? this.descripcionMeta
    this.metaAlcanzada = data?.metaAlcanzada ?? this.metaAlcanzada
    this.descripcionResultado = data?.descripcionResultado ?? this.descripcionResultado
    this.porcentajeLogradoObjetivo = data?.porcentajeLogradoObjetivo ?? this.porcentajeLogradoObjetivo
    this.porcentajeLogrado = data?.porcentajeLogrado ?? this.porcentajeLogrado
  }
  getIdRespuesta(data:any): number | string | undefined {
    if (!data) return undefined;
    const possibleKeys = [
      "idRespuestaObjetivo",
      "idRespuestasKpi",
      "idRespuestaLogro",
      "idRespuestaOrganizacional",
      "idRespuestaGerenecial",
      "idRespuestasVinculadaPuesto",
      "idRespuestaFortalezaAreaOportunidad",
      "idRespuestaNiveleDesempenioGlobal"
    ];
    const keyFound = possibleKeys.find(key => data[key] != null);
    return keyFound ? data[keyFound] : undefined;
  }

  // getIdRespuesta(key: string): number | undefined {
  //   return this[key]?.id;
  // }
}

export interface rangoDesempenio {
  min: number;
  max: number;
}

export class rangoDesempenioModel implements rangoDesempenio {
  min: number = 0;
  max: number = 0;

  constructor(data?: any) {
    this.min = data?.min ?? this.min
    this.max = data?.max ?? this.max
  }
}

export interface Pregunta {
  id: string;
  descripcion: string;
  idSeccion: number;
  idSubseccion: number;
  porcentajeObjetivo?: number;
  nivel_alcanzado?: string;
  titulo?: string;
  range: rangoDesempenioModel;
  respuesta: respuestaModel;
}

export class preguntaModel implements Pregunta {
  id: string = '';
  descripcion: string = '';
  idSeccion: number = 0;
  idSubseccion: number = 0;
  porcentajeObjetivo?: number;
  porcentaje?: number;
  nivel_alcanzado?: string;
  titulo?: string;
  range: rangoDesempenioModel = new rangoDesempenioModel();
  respuesta: respuestaModel = new respuestaModel();

  constructor(data?: any) {
    this.id = data?.id ?? this.id
    this.descripcion = data?.descripcion ?? this.descripcion
    this.idSeccion = data?.idSeccion ?? this.idSeccion
    this.idSubseccion = data?.idSubseccion ?? this.idSubseccion
    this.porcentajeObjetivo = data?.porcentajeObjetivo ?? this.porcentajeObjetivo
    this.porcentaje = data?.porcentaje ? data.porcentaje : this.porcentaje
    this.nivel_alcanzado = data?.nivel_alcanzado ?? this.nivel_alcanzado
    this.titulo = data?.titulo ?? this.titulo
    this.range = new rangoDesempenioModel(data?.range) ?? this.range
    this.respuesta = new respuestaModel(data?.respuesta) ?? this.respuesta
  }
}

export interface subSecciones {
  id: number;
  descripcion: string;
  idSeccion: number;
  porcentajeEvaluacion: number;
  preguntas: preguntaModel[]
}

export class subSeccionesModel implements subSecciones {
  id: number;
  descripcion: string;
  idSeccion: number;
  porcentajeEvaluacion: number;
  preguntas: preguntaModel[];

  constructor(data?: any) {
    this.id = data?.id ?? data?.idSubseccion ?? this.id
    this.descripcion = data?.descripcion ?? this.descripcion
    this.idSeccion = data?.idSeccion ?? this.idSeccion
    this.porcentajeEvaluacion = data?.porcentajeEvaluacion ?? this.porcentajeEvaluacion
    this.preguntas = data?.preguntas?.map((s: any) => new preguntaModel(s)) ?? this.preguntas
  }
}

export interface seccion {
  id: number;
  instrucciones: string;
  descripcion: string;
  subsecciones: subSeccionesModel[];
}

export class seccionModel implements seccion {
  id: number = 0;
  descripcion: string = '';
  instrucciones: string = '';
  subsecciones: subSeccionesModel[] = []

  constructor(data?: any) {
    this.id = data?.id ?? this.id
    this.descripcion = data?.descripcion ?? this.descripcion
    this.instrucciones = data?.instrucciones ?? this.instrucciones
    this.subsecciones = data?.subsecciones?.map((s: any) => new subSeccionesModel(s)) ?? this.subsecciones
  }
}

export interface TemplateEvaluacion {
  secciones: seccionModel[];
  usuarioEvaluado: UserCustomModel;
  usuarioEvaluador: UserCustomModel;
  asignacionEvalucion: EvaluacionAsignacion
  evaluacion:EvaluacionModel;
}

export class TemplateEvaluacionClass implements TemplateEvaluacion {
  secciones: seccionModel[];
  usuarioEvaluado: UserCustomModel;
  usuarioEvaluador: UserCustomModel;
  asignacionEvalucion: EvaluacionAsignacion
  evaluacion:EvaluacionModel;

  constructor(data: any) {
    if(data){
    this.secciones = data.secciones.map((s: any) => new seccionModel(s)) ?? this.secciones
    this.usuarioEvaluado = new UserCustomModel(data.usuarioEvaluado) ?? this.usuarioEvaluado
    this.usuarioEvaluador = new UserCustomModel(data.usuarioEvaluador) ?? this.usuarioEvaluador
    this.asignacionEvalucion = new EvaluacionAsignacionModel(data.evaluacionAsignacion) ?? this.asignacionEvalucion
    this.evaluacion = new EvaluacionModel(data.evaluacion) ?? this.evaluacion
    }
  }
}
export interface Totales {
  cumplimientoObjetivos: number;
  kpis: number;
  organizacionales: number;
  gerenciales: number;
  vinculadasPuesto: number;
  nivelDesempenioGlobal: number;
  totalCompetencias: number;
  nivelDesempenio: string;
}
export class TotalesModel implements Totales {
  cumplimientoObjetivos: number = 0;
  kpis: number = 0;
  organizacionales: number = 0;
  gerenciales: number = 0;
  vinculadasPuesto: number = 0;
  nivelDesempenioGlobal: number = 0;
  totalCompetencias: number = 0;
  nivelDesempenio: string = '';

  constructor(data?: any) {
    this.cumplimientoObjetivos = data?.cumplimientoObjetivos ?? this.cumplimientoObjetivos
    this.kpis = data?.kpis ?? this.kpis
    this.organizacionales = data?.organizacionales ?? this.organizacionales
    this.gerenciales = data?.gerenciales ?? this.gerenciales
    this.vinculadasPuesto = data?.vinculadasPuesto ?? this.vinculadasPuesto
    this.nivelDesempenioGlobal = data?.nivelDesempenioGlobal ?? this.nivelDesempenioGlobal
    this.totalCompetencias = data?.totalCompetencias ?? this.totalCompetencias
    this.nivelDesempenio = data?.nivelDesempenio ?? this.nivelDesempenio
  }
}