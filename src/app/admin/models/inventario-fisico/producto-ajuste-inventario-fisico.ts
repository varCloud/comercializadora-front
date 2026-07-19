// Producto del renglón de ajuste de inventario físico (objeto anidado de
// GET /api/inventario-fisico/{id}/ajustes). piso/pasillo/raq ya traen "SIN ACOMODAR"
// resuelto por el SP legado. Un archivo = una interfaz + su modelo (regla 11).

export interface ProductoAjusteInventarioFisico {
  idProducto: number;
  descripcion: string | null;
  ultimoCostoCompra: number;
  idLineaProducto: number;
  descripcionLinea: string | null;
  idAlmacen: number;
  almacen: string | null;
  idPiso: number;
  piso: string | null;
  idPasillo: number;
  pasillo: string | null;
  idRaq: number;
  raq: string | null;
}

export class ProductoAjusteInventarioFisicoModel implements ProductoAjusteInventarioFisico {
  idProducto: number;
  descripcion: string | null;
  ultimoCostoCompra: number;
  idLineaProducto: number;
  descripcionLinea: string | null;
  idAlmacen: number;
  almacen: string | null;
  idPiso: number;
  piso: string | null;
  idPasillo: number;
  pasillo: string | null;
  idRaq: number;
  raq: string | null;

  constructor(data: Partial<ProductoAjusteInventarioFisico> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.descripcion = data.descripcion ?? null;
    this.ultimoCostoCompra = data.ultimoCostoCompra ?? 0;
    this.idLineaProducto = data.idLineaProducto ?? 0;
    this.descripcionLinea = data.descripcionLinea ?? null;
    this.idAlmacen = data.idAlmacen ?? 0;
    this.almacen = data.almacen ?? null;
    this.idPiso = data.idPiso ?? 0;
    this.piso = data.piso ?? null;
    this.idPasillo = data.idPasillo ?? 0;
    this.pasillo = data.pasillo ?? null;
    this.idRaq = data.idRaq ?? 0;
    this.raq = data.raq ?? null;
  }
}
