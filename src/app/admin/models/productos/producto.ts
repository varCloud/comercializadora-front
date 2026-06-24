// Producto del catálogo tal como lo devuelve la API (productos list / by id / búsqueda).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON español.

export interface Producto {
  idProducto: number;
  descripcion: string;
  idUnidadMedida: number;
  descripcionUnidadMedida: string;
  idLineaProducto: number;
  descripcionLinea: string;
  cantidadUnidadMedida: number;
  articulo: string;
  codigoBarras: string;
  claveProdServ: string;
  idUnidadCompra: number | null;
  descripcionUnidadCompra: string;
  cantidadUnidadCompra: number | null;
  precioIndividual: number | null;
  precioMenudeo: number | null;
  ultimoCostoCompra: number | null;
  activo: boolean;
  fraccion: boolean;
}

export class ProductoModel implements Producto {
  idProducto: number;
  descripcion: string;
  idUnidadMedida: number;
  descripcionUnidadMedida: string;
  idLineaProducto: number;
  descripcionLinea: string;
  cantidadUnidadMedida: number;
  articulo: string;
  codigoBarras: string;
  claveProdServ: string;
  idUnidadCompra: number | null;
  descripcionUnidadCompra: string;
  cantidadUnidadCompra: number | null;
  precioIndividual: number | null;
  precioMenudeo: number | null;
  ultimoCostoCompra: number | null;
  activo: boolean;
  fraccion: boolean;

  constructor(data: Partial<Producto> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.idUnidadMedida = data.idUnidadMedida ?? 0;
    this.descripcionUnidadMedida = data.descripcionUnidadMedida ?? '';
    this.idLineaProducto = data.idLineaProducto ?? 0;
    this.descripcionLinea = data.descripcionLinea ?? '';
    this.cantidadUnidadMedida = data.cantidadUnidadMedida ?? 0;
    this.articulo = data.articulo ?? '';
    this.codigoBarras = data.codigoBarras ?? '';
    this.claveProdServ = data.claveProdServ ?? '';
    this.idUnidadCompra = data.idUnidadCompra ?? null;
    this.descripcionUnidadCompra = data.descripcionUnidadCompra ?? '';
    this.cantidadUnidadCompra = data.cantidadUnidadCompra ?? null;
    this.precioIndividual = data.precioIndividual ?? null;
    this.precioMenudeo = data.precioMenudeo ?? null;
    this.ultimoCostoCompra = data.ultimoCostoCompra ?? null;
    this.activo = data.activo ?? true;
    this.fraccion = data.fraccion ?? false;
  }
}
