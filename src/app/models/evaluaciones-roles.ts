import { Evaluacion } from "./evaluaciones";
import { Rol } from "./roles";

  
  export interface EvaluacionRol {
    idEvaluacionRol: number;
    fechaAlta: string;
    Evaluacion: Evaluacion;
    Rol: Rol;
  }


  export class EvaluacionRolModel implements EvaluacionRol {
  idEvaluacionRol: number;
  fechaAlta: string;
  Evaluacion: Evaluacion;
  Rol: Rol;

  constructor(data:any) {
    this.idEvaluacionRol = data?.idEvaluacionRol || 0;
    this.fechaAlta = data?.fechaAlta || new Date().toISOString();
    this.Evaluacion = data?.Evaluacion || { descripcion: '', periodo: '', activo: false };
    this.Rol = data?.Rol || { nomRol: '' };
  }
}