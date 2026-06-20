// Modelos de autenticación. Los nombres de campo replican el contrato JSON de la API
// (`comercializadora-api`), que es en español; por eso no se anglifican aquí.

/** Envoltorio estándar de respuesta de la API (status / mensaje / modelo). */
export interface Notificacion<T> {
  estatus: number;
  mensaje: string | null;
  modelo: T | null;
  esExitoso?: boolean;
}

/** Permiso/módulo al que tiene acceso el rol del usuario. */
export interface Permiso {
  idPermiso: number;
  idModulo: number;
  modulo: string | null;
  descripcion: string | null;
  tienePermiso: boolean;
}

export class PermisoModel implements Permiso {
  idPermiso: number;
  idModulo: number;
  modulo: string | null;
  descripcion: string | null;
  tienePermiso: boolean;

  constructor(data: Partial<Permiso> = {}) {
    this.idPermiso = data.idPermiso ?? 0;
    this.idModulo = data.idModulo ?? 0;
    this.modulo = data.modulo ?? null;
    this.descripcion = data.descripcion ?? null;
    this.tienePermiso = data.tienePermiso ?? false;
  }
}

/** Sesión del usuario autenticado devuelta por POST /auth/login (incluye el token JWT). */
export interface Sesion {
  token: string;
  idUsuario: number;
  idRol: number;
  usuario: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  telefono: string;
  idAlmacen: number;
  almacen: string;
  idSucursal: number;
  sucursal: string;
  rol: string;
  idEstacion: number;
  usuarioValido: boolean;
  comisionBancaria: number;
  diasParaHacerComplementos: number;
  devolucionesPermitidas: number;
  agregarProductosPermitidos: number;
  permisosModulo: Permiso[];
  domicilioEmpresa: string | null;
  telefonoEmpresa: string | null;
  rfcEmpresa: string | null;
}

export class SesionModel implements Sesion {
  token: string;
  idUsuario: number;
  idRol: number;
  usuario: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  telefono: string;
  idAlmacen: number;
  almacen: string;
  idSucursal: number;
  sucursal: string;
  rol: string;
  idEstacion: number;
  usuarioValido: boolean;
  comisionBancaria: number;
  diasParaHacerComplementos: number;
  devolucionesPermitidas: number;
  agregarProductosPermitidos: number;
  permisosModulo: Permiso[];
  domicilioEmpresa: string | null;
  telefonoEmpresa: string | null;
  rfcEmpresa: string | null;

  constructor(data: Partial<Sesion> = {}) {
    this.token = data.token ?? '';
    this.idUsuario = data.idUsuario ?? 0;
    this.idRol = data.idRol ?? 0;
    this.usuario = data.usuario ?? '';
    this.nombre = data.nombre ?? '';
    this.apellidoPaterno = data.apellidoPaterno ?? '';
    this.apellidoMaterno = data.apellidoMaterno ?? '';
    this.telefono = data.telefono ?? '';
    this.idAlmacen = data.idAlmacen ?? 0;
    this.almacen = data.almacen ?? '';
    this.idSucursal = data.idSucursal ?? 0;
    this.sucursal = data.sucursal ?? '';
    this.rol = data.rol ?? '';
    this.idEstacion = data.idEstacion ?? 0;
    this.usuarioValido = data.usuarioValido ?? false;
    this.comisionBancaria = data.comisionBancaria ?? 0;
    this.diasParaHacerComplementos = data.diasParaHacerComplementos ?? 0;
    this.devolucionesPermitidas = data.devolucionesPermitidas ?? 0;
    this.agregarProductosPermitidos = data.agregarProductosPermitidos ?? 0;
    this.permisosModulo = (data.permisosModulo ?? []).map((p) => new PermisoModel(p));
    this.domicilioEmpresa = data.domicilioEmpresa ?? null;
    this.telefonoEmpresa = data.telefonoEmpresa ?? null;
    this.rfcEmpresa = data.rfcEmpresa ?? null;
  }
}
