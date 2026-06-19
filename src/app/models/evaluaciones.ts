export interface Evaluacion {
    idEvaluacion: number;
    descripcion: string;
    periodo?: string;
    activo?: boolean;
    fechaAlta?: Date;
    fechaActualizacion?: Date;
    Numusuario?: string;
  }

  export class EvaluacionModel implements Evaluacion {
    idEvaluacion: number;
    descripcion: string;
    periodo?: string;
    activo?: boolean;
    fechaAlta?: Date;
    fechaActualizacion?: Date;
    Numusuario?: string;
  
    constructor(data: any) {
      this.idEvaluacion = data.idEvaluacion;
      this.descripcion = data.descripcion;
      this.periodo = data.periodo;
      this.activo = data.activo !== undefined ? data.activo : true; // Valor por defecto
      this.fechaAlta = data.fechaAlta;
      this.fechaActualizacion = data.fechaActualizacion;
      this.Numusuario = data.Numusuario;
    }
  
    // Métodos adicionales (opcional)
    public isActive(): boolean {
      return this.activo === true;
    }
  
    public getFormattedDate(): string {
      return this.fechaAlta ? this.fechaAlta.toLocaleDateString() : 'Fecha no disponible';
    }
  }