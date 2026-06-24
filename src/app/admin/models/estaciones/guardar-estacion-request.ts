// Payload de alta/edición de estación (POST /estaciones, PUT /estaciones/{id}).
// Un archivo = una interfaz + su modelo (regla 11). El idUsuario lo resuelve la API del JWT.

export interface GuardarEstacionRequest {
  idEstacion: number;
  nombre: string;
  numero: number;
  idAlmacen: number;
  macAdress: string | null;
  configurado: boolean;
}

export class GuardarEstacionRequestModel implements GuardarEstacionRequest {
  idEstacion: number;
  nombre: string;
  numero: number;
  idAlmacen: number;
  macAdress: string | null;
  configurado: boolean;

  constructor(data: Partial<GuardarEstacionRequest> = {}) {
    this.idEstacion = data.idEstacion ?? 0;
    this.nombre = data.nombre ?? '';
    this.numero = data.numero ?? 0;
    this.idAlmacen = data.idAlmacen ?? 0;
    this.macAdress = data.macAdress ?? null;
    this.configurado = data.configurado ?? false;
  }
}
