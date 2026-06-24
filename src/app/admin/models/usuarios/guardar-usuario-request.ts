// Payload de alta/edición de usuario (POST /usuarios, PUT /usuarios/{id}).
// Un archivo = una interfaz + su modelo (regla 11).

export interface GuardarUsuarioRequest {
  idUsuario: number;
  usuario: string;
  contrasena: string | null;
  telefono: string | null;
  nombre: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  idRol: number;
  idSucursal: number;
  idAlmacen: number;
  activo: boolean;
}

export class GuardarUsuarioRequestModel implements GuardarUsuarioRequest {
  idUsuario: number;
  usuario: string;
  contrasena: string | null;
  telefono: string | null;
  nombre: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  idRol: number;
  idSucursal: number;
  idAlmacen: number;
  activo: boolean;

  constructor(data: Partial<GuardarUsuarioRequest> = {}) {
    this.idUsuario = data.idUsuario ?? 0;
    this.usuario = data.usuario ?? '';
    this.contrasena = data.contrasena ?? null;
    this.telefono = data.telefono ?? null;
    this.nombre = data.nombre ?? '';
    this.apellidoPaterno = data.apellidoPaterno ?? null;
    this.apellidoMaterno = data.apellidoMaterno ?? null;
    this.idRol = data.idRol ?? 0;
    this.idSucursal = data.idSucursal ?? 0;
    this.idAlmacen = data.idAlmacen ?? 0;
    this.activo = data.activo ?? true;
  }
}
