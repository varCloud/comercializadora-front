// Payload de alta/edición de proveedor (POST /proveedores, PUT /proveedores/{id}).
// Un archivo = una interfaz + su modelo (regla 11).

export interface GuardarProveedorRequest {
  idProveedor: number;
  nombre: string;
  descripcion: string;
  telefono: string;
  direccion: string;
  activo: boolean;
}

export class GuardarProveedorRequestModel implements GuardarProveedorRequest {
  idProveedor: number;
  nombre: string;
  descripcion: string;
  telefono: string;
  direccion: string;
  activo: boolean;

  constructor(data: Partial<GuardarProveedorRequest> = {}) {
    this.idProveedor = data.idProveedor ?? 0;
    this.nombre = data.nombre ?? '';
    this.descripcion = data.descripcion ?? '';
    this.telefono = data.telefono ?? '';
    this.direccion = data.direccion ?? '';
    this.activo = data.activo ?? true;
  }
}
