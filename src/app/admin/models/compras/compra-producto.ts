// Línea de detalle de una compra (un producto), como la devuelve la API
// (SP_V2_CONSULTA_COMPRA_DETALLE) y como se edita en el modal. Un archivo = una interfaz + su
// modelo (regla 11). `idEstatusProducto > 0` => ya recibido/devuelto: cantidad de solo lectura
// y la fila no se puede eliminar.

export interface CompraProducto {
  idProducto: number;
  descripcion: string;
  idEstatusProducto: number;
  estatusProducto: string;
  observaciones: string;
  cantidadRecibida: number;
  cantidadDevuelta: number;
  cantidad: number;
  precio: number;
  total: number;
  fraccion: boolean;
}

export class CompraProductoModel implements CompraProducto {
  idProducto: number;
  descripcion: string;
  idEstatusProducto: number;
  estatusProducto: string;
  observaciones: string;
  cantidadRecibida: number;
  cantidadDevuelta: number;
  cantidad: number;
  precio: number;
  total: number;
  fraccion: boolean;

  constructor(data: Partial<CompraProducto> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.idEstatusProducto = data.idEstatusProducto ?? 0;
    this.estatusProducto = data.estatusProducto ?? 'Pendiente';
    this.observaciones = data.observaciones ?? '';
    this.cantidadRecibida = data.cantidadRecibida ?? 0;
    this.cantidadDevuelta = data.cantidadDevuelta ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.precio = data.precio ?? 0;
    this.total = data.total ?? 0;
    this.fraccion = data.fraccion ?? false;
  }
}
