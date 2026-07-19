// Renglón del proceso de producción a granel, tal como lo devuelve la API
// (GET /api/produccion-agranel, resultset de SP_V2_CONSULTA_PROCESO_PRODUCCION_AGRANEL).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON de la API.

/** Estatus del proceso (CatEstatusProcesoAgranel): 1/2 pendiente, 3 procesado, 4 rechazo total, 5 rechazo parcial. */
export const ESTATUS_AGRANEL_PENDIENTES = [1, 2];

export interface ProcesoProduccionAgranel {
  idProcesoProduccionAgranel: number;
  idProducto: number;
  idUbicacion: number;
  idAlmacen: number | null;
  idUsuario: number;
  cantidad: number;
  cantidadAceptada: number;
  cantidadRestante: number;
  fechaAlta: string | null;
  codigoBarras: string | null;
  descripcionProducto: string | null;
  idLineaProducto: number;
  descripcionLinea: string | null;
  idEstatusProduccionAgranel: number;
  descripcionEstatus: string | null;
  ultimoCostoCompra: number;
  nombreUsuario: string | null;
}

export class ProcesoProduccionAgranelModel implements ProcesoProduccionAgranel {
  idProcesoProduccionAgranel: number;
  idProducto: number;
  idUbicacion: number;
  idAlmacen: number | null;
  idUsuario: number;
  cantidad: number;
  cantidadAceptada: number;
  cantidadRestante: number;
  fechaAlta: string | null;
  codigoBarras: string | null;
  descripcionProducto: string | null;
  idLineaProducto: number;
  descripcionLinea: string | null;
  idEstatusProduccionAgranel: number;
  descripcionEstatus: string | null;
  ultimoCostoCompra: number;
  nombreUsuario: string | null;

  constructor(data: Partial<ProcesoProduccionAgranel> = {}) {
    this.idProcesoProduccionAgranel = data.idProcesoProduccionAgranel ?? 0;
    this.idProducto = data.idProducto ?? 0;
    this.idUbicacion = data.idUbicacion ?? 0;
    this.idAlmacen = data.idAlmacen ?? null;
    this.idUsuario = data.idUsuario ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.cantidadAceptada = data.cantidadAceptada ?? 0;
    this.cantidadRestante = data.cantidadRestante ?? 0;
    this.fechaAlta = data.fechaAlta ?? null;
    this.codigoBarras = data.codigoBarras ?? null;
    this.descripcionProducto = data.descripcionProducto ?? null;
    this.idLineaProducto = data.idLineaProducto ?? 0;
    this.descripcionLinea = data.descripcionLinea ?? null;
    this.idEstatusProduccionAgranel = data.idEstatusProduccionAgranel ?? 0;
    this.descripcionEstatus = data.descripcionEstatus ?? null;
    this.ultimoCostoCompra = data.ultimoCostoCompra ?? 0;
    this.nombreUsuario = data.nombreUsuario ?? null;
  }

  /** Solo los renglones pendientes (estatus 1/2) se pueden aprobar/rechazar. */
  get esPendiente(): boolean {
    return ESTATUS_AGRANEL_PENDIENTES.includes(this.idEstatusProduccionAgranel);
  }
}
