// Carga de mercancía de trapeadores, tal como la devuelve la API
// (GET /api/produccion-trapeadores, resultset de SP_V2_CONSULTA_CARGA_MERCANCIA_LIQUIDOS
// filtrado por idTipoMovInventario = 32, fijo en el repository).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON de la API.
// Mismo shape que CargaMercanciaLiquidos (entidad de dominio separada en la API).

export interface CargaMercanciaTrapeadores {
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

export class CargaMercanciaTrapeadoresModel implements CargaMercanciaTrapeadores {
  idProducto: number;
  descripcionUbicacion: string | null;
  descripcionProducto: string | null;
  cantidad: number;
  nombreUsuario: string | null;
  fechaAlta: string | null;
  descripcionRol: string | null;
  ultimoCostoCompra: number;
  descTipoMovInventario: string | null;

  constructor(data: Partial<CargaMercanciaTrapeadores> = {}) {
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
