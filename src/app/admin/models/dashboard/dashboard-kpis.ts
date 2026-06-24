// KPIs del dashboard tal como los devuelve la API (dashboard/kpis).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON español.

import { Categoria, CategoriaModel } from './categoria';
import { MermaMensual, MermaMensualModel } from './merma-mensual';
import {
  CostoProduccionMensual,
  CostoProduccionMensualModel,
} from './costo-produccion-mensual';

export interface DashboardKpis {
  ventasDia: number;
  ventasSemana: number;
  ventasMes: number;
  ventasAnio: number;
  informacionGlobal: Categoria[];
  mermaActual: MermaMensual | null;
  mermaAnterior: MermaMensual | null;
  costoProduccionActual: CostoProduccionMensual | null;
  costoProduccionAnterior: CostoProduccionMensual | null;
}

export class DashboardKpisModel implements DashboardKpis {
  ventasDia: number;
  ventasSemana: number;
  ventasMes: number;
  ventasAnio: number;
  informacionGlobal: Categoria[];
  mermaActual: MermaMensual | null;
  mermaAnterior: MermaMensual | null;
  costoProduccionActual: CostoProduccionMensual | null;
  costoProduccionAnterior: CostoProduccionMensual | null;

  constructor(data: Partial<DashboardKpis> = {}) {
    this.ventasDia = data.ventasDia ?? 0;
    this.ventasSemana = data.ventasSemana ?? 0;
    this.ventasMes = data.ventasMes ?? 0;
    this.ventasAnio = data.ventasAnio ?? 0;
    this.informacionGlobal = (data.informacionGlobal ?? []).map(
      (c) => new CategoriaModel(c),
    );
    this.mermaActual = data.mermaActual
      ? new MermaMensualModel(data.mermaActual)
      : null;
    this.mermaAnterior = data.mermaAnterior
      ? new MermaMensualModel(data.mermaAnterior)
      : null;
    this.costoProduccionActual = data.costoProduccionActual
      ? new CostoProduccionMensualModel(data.costoProduccionActual)
      : null;
    this.costoProduccionAnterior = data.costoProduccionAnterior
      ? new CostoProduccionMensualModel(data.costoProduccionAnterior)
      : null;
  }
}
