import { enumEstatusEvaluacionAsignacion } from "../config/enum";
import { Claves, ClavesModel } from "./claves";
import { EvaluacionesResultados, EvaluacionesResultadosModel } from "./evaluaciones-resultados.model";
import { EvaluacionRol, EvaluacionRolModel } from "./evaluaciones-roles";

export interface EvaluacionesContestadasList {
    idEvaluacionAsignacion: string;
    idEstatusEvaluacionAsignacion: number;
    evaluacionesRol:EvaluacionRol;
    estatusEvaluacion:string;
    evaluado: Claves
    evaluador: Claves
    evaluacionResultado: EvaluacionesResultados;
    labelEstatusEvaluacionAsingacion?:string
    colorChipEstatusEvaluacionAsingacion?: string
}

export class EvaluacionesContestadasListModelModel implements EvaluacionesContestadasList {
    idEvaluacionAsignacion: string;
    idEstatusEvaluacionAsignacion: number;
    evaluacionesRol:EvaluacionRol;
    estatusEvaluacion:string;
    evaluado: Claves;
    evaluador: Claves;
    evaluacionResultado: EvaluacionesResultados;
    labelEstatusEvaluacionAsingacion: string = '';
    colorChipEstatusEvaluacionAsingacion: string = '';
    constructor(data: any) {
        this.idEvaluacionAsignacion = data.idEvaluacionAsignacion?? this.idEvaluacionAsignacion;
        this.idEstatusEvaluacionAsignacion = data.idEstatusEvaluacionAsignacion ?? this.idEstatusEvaluacionAsignacion;
        this.evaluacionesRol = new EvaluacionRolModel(data.EvaluacionesRole) ?? this.evaluacionesRol;
        this.estatusEvaluacion = data.EstatusEvaluacion ?? this.estatusEvaluacion;
        this.evaluado =  new ClavesModel(data.Evaluado) ?? this.evaluado;
        this.evaluador =  new ClavesModel(data.Evaluador) ?? this.evaluador;
        this.evaluacionResultado = data.EvaluacionResultado ? new EvaluacionesResultadosModel(data.EvaluacionResultado) : this.evaluacionResultado;
        this.labelEstatusEvaluacionAsingacion = this.getlabelEstatusEvaluacionAsingacion();
        this.colorChipEstatusEvaluacionAsingacion = this.getColorChipEstatusEvaluacionAsingacion();
    }

    getlabelEstatusEvaluacionAsingacion(): string {
        if(this.idEstatusEvaluacionAsignacion == enumEstatusEvaluacionAsignacion.SIN_CONTESTAR) {
            return 'Sin contestar';
        } else if(this.idEstatusEvaluacionAsignacion == enumEstatusEvaluacionAsignacion.CONTESTADA) {
            return 'Contestada';    
        } else if(this.idEstatusEvaluacionAsignacion == enumEstatusEvaluacionAsignacion.PENDIENTE) {
            return 'Pendiente';
        }
        return '';
    }

    getColorChipEstatusEvaluacionAsingacion(): string {
        if(this.idEstatusEvaluacionAsignacion == enumEstatusEvaluacionAsignacion.SIN_CONTESTAR) {
            return 'bg-light-accent text-accent';
        } else if(this.idEstatusEvaluacionAsignacion == enumEstatusEvaluacionAsignacion.CONTESTADA) {
            return 'bg-light-success text-success';    
        } else if(this.idEstatusEvaluacionAsignacion == enumEstatusEvaluacionAsignacion.PENDIENTE) {
            return 'bg-light-warning text-warning';
        }
        return '';
    }

}