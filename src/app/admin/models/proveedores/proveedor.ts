// Proveedor tal como lo devuelve la API (proveedores list / by id).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON español.

export interface Proveedor {
  idProveedor: number;
  nombre: string;
  descripcion: string;
  telefono: string;
  direccion: string;
  activo: boolean;
  totalPedidosIncompletos: number;
  totalPedidosTotales: number;
  totalPedidosCompletos: number;
  porcAtendido: number;
}

export class ProveedorModel implements Proveedor {
  idProveedor: number;
  nombre: string;
  descripcion: string;
  telefono: string;
  direccion: string;
  activo: boolean;
  totalPedidosIncompletos: number;
  totalPedidosTotales: number;
  totalPedidosCompletos: number;
  porcAtendido: number;

  constructor(data: Partial<Proveedor> = {}) {
    this.idProveedor = data.idProveedor ?? 0;
    this.nombre = data.nombre ?? '';
    this.descripcion = data.descripcion ?? '';
    this.telefono = data.telefono ?? '';
    this.direccion = data.direccion ?? '';
    this.activo = data.activo ?? true;
    this.totalPedidosIncompletos = data.totalPedidosIncompletos ?? 0;
    this.totalPedidosTotales = data.totalPedidosTotales ?? 0;
    this.totalPedidosCompletos = data.totalPedidosCompletos ?? 0;
    this.porcAtendido = data.porcAtendido ?? 0;
  }
}
