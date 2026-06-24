// Payload de alta/edición de producto (POST /productos, PUT /productos/{id}).
// Un archivo = una interfaz + su modelo (regla 11). artículo y código de barras separados (P1).

export interface GuardarProductoRequest {
  idProducto: number;
  descripcion: string;
  idUnidadMedida: number;
  idLineaProducto: number;
  cantidadUnidadMedida: number;
  articulo: string;
  codigoBarras: string | null;
  claveProdServ: string;
  idUnidadCompra: number | null;
  cantidadUnidadCompra: number | null;
  activo: boolean;
}

export class GuardarProductoRequestModel implements GuardarProductoRequest {
  idProducto: number;
  descripcion: string;
  idUnidadMedida: number;
  idLineaProducto: number;
  cantidadUnidadMedida: number;
  articulo: string;
  codigoBarras: string | null;
  claveProdServ: string;
  idUnidadCompra: number | null;
  cantidadUnidadCompra: number | null;
  activo: boolean;

  constructor(data: Partial<GuardarProductoRequest> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.idUnidadMedida = data.idUnidadMedida ?? 0;
    this.idLineaProducto = data.idLineaProducto ?? 0;
    this.cantidadUnidadMedida = data.cantidadUnidadMedida ?? 0;
    this.articulo = data.articulo ?? '';
    this.codigoBarras = data.codigoBarras ?? null;
    this.claveProdServ = data.claveProdServ ?? '';
    this.idUnidadCompra = data.idUnidadCompra ?? null;
    this.cantidadUnidadCompra = data.cantidadUnidadCompra ?? null;
    this.activo = data.activo ?? true;
  }
}
