// Payload del cambio de estatus (PATCH /api/inventario-fisico/{id}/estatus).
// idEstatus: 2 = iniciar, 3 = finalizar y afectar, 4 = cancelar (las transiciones las valida
// el SP legado). Un archivo = una interfaz + su modelo (regla 11).

export interface ActualizarEstatusInventarioFisicoRequest {
  idEstatus: number;
  observaciones?: string | null;
}

export class ActualizarEstatusInventarioFisicoRequestModel
  implements ActualizarEstatusInventarioFisicoRequest
{
  idEstatus: number;
  observaciones: string | null;

  constructor(data: Partial<ActualizarEstatusInventarioFisicoRequest> = {}) {
    this.idEstatus = data.idEstatus ?? 0;
    this.observaciones = data.observaciones ?? null;
  }
}
