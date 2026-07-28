// Renglón del reporte "MPL Individual" (detalle de costo de producción a granel por
// producto), tal como lo devuelve la API (GET /api/consumo-mpl-individual,
// SP_V2_CONSULTA_COSTO_PRODUCCION_POR_PRODUCTO). Hermano de "MPL Agrupado" (consumo-mpl),
// pero a nivel de renglón individual del proceso, no agregado por mes/almacén/línea.
// Un archivo = una interfaz + su modelo (regla 09/11).

export interface CostoProduccionAgranelPorProducto {
  idProcesoProduccionAgranel: number;
  idProducto: number;
  codigoBarras: string | null;
  descripcionProducto: string | null;
  cantidad: number;
  cantidadAceptada: number;
  cantidadRestante: number;
  fechaAlta: string | null;
  fechaUltimaActualizacion: string | null;
  idEstatusProduccionAgranel: number;
  descripcionEstatus: string | null;
  ultimoCostoCompra: number;
  costoProduccion: number;
}

export class CostoProduccionAgranelPorProductoModel implements CostoProduccionAgranelPorProducto {
  idProcesoProduccionAgranel: number;
  idProducto: number;
  codigoBarras: string | null;
  descripcionProducto: string | null;
  cantidad: number;
  cantidadAceptada: number;
  cantidadRestante: number;
  fechaAlta: string | null;
  fechaUltimaActualizacion: string | null;
  idEstatusProduccionAgranel: number;
  descripcionEstatus: string | null;
  ultimoCostoCompra: number;
  costoProduccion: number;

  constructor(data: Partial<CostoProduccionAgranelPorProducto> = {}) {
    this.idProcesoProduccionAgranel = data.idProcesoProduccionAgranel ?? 0;
    this.idProducto = data.idProducto ?? 0;
    this.codigoBarras = data.codigoBarras ?? null;
    this.descripcionProducto = data.descripcionProducto ?? null;
    this.cantidad = data.cantidad ?? 0;
    this.cantidadAceptada = data.cantidadAceptada ?? 0;
    this.cantidadRestante = data.cantidadRestante ?? 0;
    this.fechaAlta = data.fechaAlta ?? null;
    this.fechaUltimaActualizacion = data.fechaUltimaActualizacion ?? null;
    this.idEstatusProduccionAgranel = data.idEstatusProduccionAgranel ?? 0;
    this.descripcionEstatus = data.descripcionEstatus ?? null;
    this.ultimoCostoCompra = data.ultimoCostoCompra ?? 0;
    this.costoProduccion = data.costoProduccion ?? 0;
  }
}
