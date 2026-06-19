export interface EstatusEvaluacion {
  id: number;
  descripcion: string;
  activo: number;
  fechaAlta: Date
}

export class EstatusEvaluacionModel implements EstatusEvaluacion {
  id: number;
  descripcion: string;
  activo: number;
  fechaAlta: Date;
  
  constructor(data:any){
    this.id = data.id ?? this.id
    this.descripcion = data.descripcion ?? this.descripcion
    this.activo = data.activo ?? this.activo
    this.fechaAlta = data.fechaAlta ?? new Date().toISOString();
  }
}