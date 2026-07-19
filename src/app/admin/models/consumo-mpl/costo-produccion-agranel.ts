// Renglón del reporte "Consumo de MPL" (nombre técnico legado "Costo de Producción Agranel"),
// tal como lo devuelve la API (GET /api/consumo-mpl, SP_V2_CONSULTA_COSTO_PRODUCCION).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON de la API
// (confirmados contra el resultset real, son exactamente estos 9 — ver hu_consumo_mpl.md).

export interface CostoProduccionAgranel {
  idProducto: number;
  codigoBarras: string | null;
  descripcionProducto: string | null;
  idLineaProducto: number;
  descripcionLinea: string | null;
  cantidadSolicitadaMesAnt: number;
  cantidadAceptadaFinalMesAnt: number;
  ultCostoCompra: number;
  costoProduccionMerma: number;
}

export class CostoProduccionAgranelModel implements CostoProduccionAgranel {
  idProducto: number;
  codigoBarras: string | null;
  descripcionProducto: string | null;
  idLineaProducto: number;
  descripcionLinea: string | null;
  cantidadSolicitadaMesAnt: number;
  cantidadAceptadaFinalMesAnt: number;
  ultCostoCompra: number;
  costoProduccionMerma: number;

  constructor(data: Partial<CostoProduccionAgranel> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.codigoBarras = data.codigoBarras ?? null;
    this.descripcionProducto = data.descripcionProducto ?? null;
    this.idLineaProducto = data.idLineaProducto ?? 0;
    this.descripcionLinea = data.descripcionLinea ?? null;
    this.cantidadSolicitadaMesAnt = data.cantidadSolicitadaMesAnt ?? 0;
    this.cantidadAceptadaFinalMesAnt = data.cantidadAceptadaFinalMesAnt ?? 0;
    this.ultCostoCompra = data.ultCostoCompra ?? 0;
    this.costoProduccionMerma = data.costoProduccionMerma ?? 0;
  }

  /**
   * "Cantidad Restante": NO viaja en el resultset del SP (confirmado contra la API) — se
   * calcula en el front, igual que la vista legada (`@Math.Round(solicitada - aceptada)`).
   * Getter derivado (mismo patrón que `esPendiente` en ProcesoProduccionAgranelModel).
   */
  get cantidadRestanteMesAnt(): number {
    return this.cantidadSolicitadaMesAnt - this.cantidadAceptadaFinalMesAnt;
  }
}
