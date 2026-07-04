// Carga de mercancía de líquidos, tal como la devuelve la API
// (GET /api/produccion-liquidos, resultset de SP_V2_CONSULTA_CARGA_MERCANCIA_LIQUIDOS).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON de la API.

export interface CargaMercanciaLiquidos {
  idProducto: number;
  descripcionUbicacion: string | null;
  descripcionProducto: string | null;
  cantidad: number;
  nombreUsuario: string | null;
  fechaAlta: string | null;
  descripcionRol: string | null;
  ultimoCostoCompra: number;
  descTipoMovInventario: string | null;
}

export class CargaMercanciaLiquidosModel implements CargaMercanciaLiquidos {
  idProducto: number;
  descripcionUbicacion: string | null;
  descripcionProducto: string | null;
  cantidad: number;
  nombreUsuario: string | null;
  fechaAlta: string | null;
  descripcionRol: string | null;
  ultimoCostoCompra: number;
  descTipoMovInventario: string | null;

  constructor(data: Partial<CargaMercanciaLiquidos> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.descripcionUbicacion = data.descripcionUbicacion ?? null;
    this.descripcionProducto = data.descripcionProducto ?? null;
    this.cantidad = data.cantidad ?? 0;
    this.nombreUsuario = data.nombreUsuario ?? null;
    this.fechaAlta = data.fechaAlta ?? null;
    this.descripcionRol = data.descripcionRol ?? null;
    this.ultimoCostoCompra = data.ultimoCostoCompra ?? 0;
    this.descTipoMovInventario = data.descTipoMovInventario ?? null;
  }
}
