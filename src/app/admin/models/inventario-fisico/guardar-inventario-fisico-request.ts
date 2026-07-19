// Payload de alta (POST /api/inventario-fisico) y de renombrado (PUT /api/inventario-fisico/{id}).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON de la API.

export interface GuardarInventarioFisicoRequest {
  nombre: string;
}

export class GuardarInventarioFisicoRequestModel implements GuardarInventarioFisicoRequest {
  nombre: string;

  constructor(data: Partial<GuardarInventarioFisicoRequest> = {}) {
    this.nombre = data.nombre ?? '';
  }
}
