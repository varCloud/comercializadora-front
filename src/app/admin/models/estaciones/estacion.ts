// Estación tal como la devuelve la API (estaciones list / by id).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON español.

export interface Estacion {
  idEstacion: number;
  idAlmacen: number;
  nombreAlmacen: string;
  macAdress: string;
  nombre: string;
  numero: number;
  configurado: boolean;
  idUsuario: number;
  idStatus: number;
  idSucursal: number;
}

export class EstacionModel implements Estacion {
  idEstacion: number;
  idAlmacen: number;
  nombreAlmacen: string;
  macAdress: string;
  nombre: string;
  numero: number;
  configurado: boolean;
  idUsuario: number;
  idStatus: number;
  idSucursal: number;

  constructor(data: Partial<Estacion> = {}) {
    this.idEstacion = data.idEstacion ?? 0;
    this.idAlmacen = data.idAlmacen ?? 0;
    this.nombreAlmacen = data.nombreAlmacen ?? '';
    this.macAdress = data.macAdress ?? '';
    this.nombre = data.nombre ?? '';
    this.numero = data.numero ?? 0;
    this.configurado = data.configurado ?? false;
    this.idUsuario = data.idUsuario ?? 0;
    this.idStatus = data.idStatus ?? 0;
    this.idSucursal = data.idSucursal ?? 0;
  }
}
