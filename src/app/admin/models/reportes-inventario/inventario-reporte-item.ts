// Fila del listado paginado de "Reportes > Inventario" (SP_V2_CONSULTA_INVENTARIO en modo
// listado). Un archivo = una interfaz + su modelo (regla 11).

export interface InventarioReporteItem {
  fecha: string;
  almacen: string;
  descripcionLinea: string;
  descripcion: string;
  codigoBarras: string;
  cantidad: number;
  costo: number;
}

export class InventarioReporteItemModel implements InventarioReporteItem {
  fecha: string;
  almacen: string;
  descripcionLinea: string;
  descripcion: string;
  codigoBarras: string;
  cantidad: number;
  costo: number;

  constructor(data: Partial<InventarioReporteItem> = {}) {
    this.fecha = data.fecha ?? '';
    this.almacen = data.almacen ?? '';
    this.descripcionLinea = data.descripcionLinea ?? '';
    this.descripcion = data.descripcion ?? '';
    this.codigoBarras = data.codigoBarras ?? '';
    this.cantidad = data.cantidad ?? 0;
    this.costo = data.costo ?? 0;
  }
}
