// Renglón del ajuste de inventario físico (GET /api/inventario-fisico/{id}/ajustes,
// SP_CONSULTA_AJUSTE_INVENTARIO). La lista llega completa sin paginar; el front pagina
// localmente (regla 10). Un archivo = una interfaz + su modelo (regla 11).

import {
  ProductoAjusteInventarioFisico,
  ProductoAjusteInventarioFisicoModel,
} from './producto-ajuste-inventario-fisico';

export interface AjusteInventarioFisico {
  idAjusteInventarioFisico: number;
  cantidadActual: number;
  cantidadEnFisico: number;
  cantidadAAjustar: number;
  fechaAlta: string | null;
  ajustado: boolean;
  errorHumano: number;
  idInventarioFisico: number;
  idEstatusInventarioFisico: number;
  producto: ProductoAjusteInventarioFisico;
}

export class AjusteInventarioFisicoModel implements AjusteInventarioFisico {
  idAjusteInventarioFisico: number;
  cantidadActual: number;
  cantidadEnFisico: number;
  cantidadAAjustar: number;
  fechaAlta: string | null;
  ajustado: boolean;
  errorHumano: number;
  idInventarioFisico: number;
  idEstatusInventarioFisico: number;
  producto: ProductoAjusteInventarioFisico;

  constructor(data: Partial<AjusteInventarioFisico> = {}) {
    this.idAjusteInventarioFisico = data.idAjusteInventarioFisico ?? 0;
    this.cantidadActual = data.cantidadActual ?? 0;
    this.cantidadEnFisico = data.cantidadEnFisico ?? 0;
    this.cantidadAAjustar = data.cantidadAAjustar ?? 0;
    this.fechaAlta = data.fechaAlta ?? null;
    this.ajustado = data.ajustado ?? false;
    this.errorHumano = data.errorHumano ?? 0;
    this.idInventarioFisico = data.idInventarioFisico ?? 0;
    this.idEstatusInventarioFisico = data.idEstatusInventarioFisico ?? 0;
    this.producto = new ProductoAjusteInventarioFisicoModel(data.producto ?? {});
  }
}
