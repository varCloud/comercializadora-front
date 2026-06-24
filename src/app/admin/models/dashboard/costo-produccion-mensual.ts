// Costo de producción mensual tal como lo devuelve la API (dashboard/kpis).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON español.

export interface CostoProduccionMensual {
  descripcion: string;
  ultimoDiaMesActual: string;
  ultimoDiaMesCalculo: string;
  totalCantidadAceptada: number;
  totalPorcCostoProduccion: number;
  totalCostoProduccion: number;
  promedioCantidadAceptada: number;
  promedioPorcCostoProduccion: number;
  promedioCostoProduccion: number;
}

export class CostoProduccionMensualModel implements CostoProduccionMensual {
  descripcion: string;
  ultimoDiaMesActual: string;
  ultimoDiaMesCalculo: string;
  totalCantidadAceptada: number;
  totalPorcCostoProduccion: number;
  totalCostoProduccion: number;
  promedioCantidadAceptada: number;
  promedioPorcCostoProduccion: number;
  promedioCostoProduccion: number;

  constructor(data: Partial<CostoProduccionMensual> = {}) {
    this.descripcion = data.descripcion ?? '';
    this.ultimoDiaMesActual = data.ultimoDiaMesActual ?? '';
    this.ultimoDiaMesCalculo = data.ultimoDiaMesCalculo ?? '';
    this.totalCantidadAceptada = data.totalCantidadAceptada ?? 0;
    this.totalPorcCostoProduccion = data.totalPorcCostoProduccion ?? 0;
    this.totalCostoProduccion = data.totalCostoProduccion ?? 0;
    this.promedioCantidadAceptada = data.promedioCantidadAceptada ?? 0;
    this.promedioPorcCostoProduccion = data.promedioPorcCostoProduccion ?? 0;
    this.promedioCostoProduccion = data.promedioCostoProduccion ?? 0;
  }
}
