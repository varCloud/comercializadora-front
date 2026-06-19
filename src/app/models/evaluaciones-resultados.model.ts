export interface EvaluacionesResultados {
    idEvaluacionResultado: number;
    idEvaluacionAsignacion: number;
    cumplimientoObjetivos: number;
    kpis: number;
    organizacionales: number;
    gerenciales: number;
    vinculadasPuesto: number;
    nivelDesempenioGlobal: number;
    fechaAlta: Date;
}

export class EvaluacionesResultadosModel implements EvaluacionesResultados {
    idEvaluacionResultado: number;
    idEvaluacionAsignacion: number;
    cumplimientoObjetivos: number;
    kpis: number;
    organizacionales: number;
    gerenciales: number;
    vinculadasPuesto: number;
    nivelDesempenioGlobal: number;
    fechaAlta: Date;

    constructor(data: any) {
        this.idEvaluacionResultado = data.idEvaluacionResultado ?? this.idEvaluacionResultado;
        this.idEvaluacionAsignacion = data.idEvaluacionAsignacion ?? this.idEvaluacionAsignacion;
        this.cumplimientoObjetivos = data.cumplimientoObjetivos ?? this.cumplimientoObjetivos;
        this.kpis = data.kpis ?? this.kpis;
        this.organizacionales = data.organizacionales ?? this.organizacionales;
        this.gerenciales = data.gerenciales ?? this.gerenciales;
        this.vinculadasPuesto = data.vinculadasPuesto ?? this.vinculadasPuesto;
        this.nivelDesempenioGlobal = data.nivelDesempenioGlobal ?? this.nivelDesempenioGlobal;
        this.fechaAlta = data.fechaAlta ?? this.fechaAlta;
    }
}