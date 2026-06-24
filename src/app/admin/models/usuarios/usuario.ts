// Usuario tal como lo devuelve la API (GET /usuarios, GET /usuarios/{id}).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON español.

export interface Usuario {
  idUsuario: number;
  idRol: number;
  usuario: string;
  telefono: string | null;
  idAlmacen: number;
  idSucursal: number;
  nombre: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  fechaAlta: string | null;
  activo: boolean;
  descripcionRol: string | null;
  descripcionSucursal: string | null;
  descripcionAlmacen: string | null;
  nombreCompleto: string | null;
}

export class UsuarioModel implements Usuario {
  idUsuario: number;
  idRol: number;
  usuario: string;
  telefono: string | null;
  idAlmacen: number;
  idSucursal: number;
  nombre: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  fechaAlta: string | null;
  activo: boolean;
  descripcionRol: string | null;
  descripcionSucursal: string | null;
  descripcionAlmacen: string | null;
  nombreCompleto: string | null;

  constructor(data: Partial<Usuario> = {}) {
    this.idUsuario = data.idUsuario ?? 0;
    this.idRol = data.idRol ?? 0;
    this.usuario = data.usuario ?? '';
    this.telefono = data.telefono ?? null;
    this.idAlmacen = data.idAlmacen ?? 0;
    this.idSucursal = data.idSucursal ?? 0;
    this.nombre = data.nombre ?? '';
    this.apellidoPaterno = data.apellidoPaterno ?? null;
    this.apellidoMaterno = data.apellidoMaterno ?? null;
    this.fechaAlta = data.fechaAlta ?? null;
    this.activo = data.activo ?? false;
    this.descripcionRol = data.descripcionRol ?? null;
    this.descripcionSucursal = data.descripcionSucursal ?? null;
    this.descripcionAlmacen = data.descripcionAlmacen ?? null;
    this.nombreCompleto = data.nombreCompleto ?? null;
  }
}
