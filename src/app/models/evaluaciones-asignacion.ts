import { EstatusEvaluacionModel } from "./estatusEvaluacion"
import { EvaluacionRolModel } from "./evaluaciones-roles"

export interface EvaluacionAsignacion {
  idEvaluacionAsignacion: string
  idEvaluacionRol?: string
  NumusuarioEvaluado: number
  NumusuarioEvaluador: number
  Numusuario: number
  activo: number
  fechaAsignacion: Date
  EvaluacionesRole?: EvaluacionRolModel
  idEstatusEvaluacionAsignacion: number
  EstatusEvaluacion: EstatusEvaluacionModel
}

export class EvaluacionAsignacionModel implements EvaluacionAsignacion {
  idEvaluacionAsignacion: string
  idEvaluacionRol?: string | undefined
  NumusuarioEvaluado: number
  NumusuarioEvaluador: number
  Numusuario: number
  activo: number
  fechaAsignacion: Date
  EvaluacionesRole?: EvaluacionRolModel
  idEstatusEvaluacionAsignacion: number
  EstatusEvaluacion: EstatusEvaluacionModel

  constructor(data: any) {
    this.idEvaluacionAsignacion = data.idEvaluacionAsignacion ?? this.idEvaluacionAsignacion
    this.idEvaluacionRol = data.idEvaluacionRol ?? this.idEvaluacionRol
    this.NumusuarioEvaluado = data.NumusuarioEvaluado ?? this.NumusuarioEvaluado
    this.NumusuarioEvaluador = data.NumusuarioEvaluador ?? this.NumusuarioEvaluador
    this.Numusuario = data.Numusuario ?? this.Numusuario
    this.activo = data.activo ?? this.activo
    this.fechaAsignacion = data.fechaAsignacion ?? this.fechaAsignacion
    if (data.EvaluacionesRole) {
      this.EvaluacionesRole = data.EvaluacionesRole ?? this.EvaluacionesRole
    }
    this.idEstatusEvaluacionAsignacion = data.idEstatusEvaluacionAsignacion ?? this.idEstatusEvaluacionAsignacion
    this.EstatusEvaluacion = data.EstatusEvaluacion ?? this.EstatusEvaluacion
  }
}