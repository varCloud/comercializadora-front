// Merma mensual tal como la devuelve la API (dashboard/kpis).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON español.

export interface MermaMensual {
  descripcion: string;
  ultimoDiaMesActual: string;
  ultimoDiaMesCalculo: string;
  totalMerma: number;
  totalPorcMerma: number;
  totalCostoMerma: number;
  promedioMerma: number;
  promedioPorcMerma: number;
  promedioCostoMerma: number;
}

export class MermaMensualModel implements MermaMensual {
  descripcion: string;
  ultimoDiaMesActual: string;
  ultimoDiaMesCalculo: string;
  totalMerma: number;
  totalPorcMerma: number;
  totalCostoMerma: number;
  promedioMerma: number;
  promedioPorcMerma: number;
  promedioCostoMerma: number;

  constructor(data: Partial<MermaMensual> = {}) {
    this.descripcion = data.descripcion ?? '';
    this.ultimoDiaMesActual = data.ultimoDiaMesActual ?? '';
    this.ultimoDiaMesCalculo = data.ultimoDiaMesCalculo ?? '';
    this.totalMerma = data.totalMerma ?? 0;
    this.totalPorcMerma = data.totalPorcMerma ?? 0;
    this.totalCostoMerma = data.totalCostoMerma ?? 0;
    this.promedioMerma = data.promedioMerma ?? 0;
    this.promedioPorcMerma = data.promedioPorcMerma ?? 0;
    this.promedioCostoMerma = data.promedioCostoMerma ?? 0;
  }
}
