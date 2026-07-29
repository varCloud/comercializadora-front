// Payload para aprobar/rechazar un retiro (`PATCH /api/caja/retiros/{id}/estatus`), réplica de
// `ActualizarEstatusRetiro()` en `EvtVentas.js` (permite ajustar el monto autorizado al
// aprobar). Un archivo = una interfaz + su modelo (regla 11).

import { ESTATUS_RETIRO } from 'src/app/admin/models/ventas/estatus-retiro';

export interface ActualizarEstatusRetiroRequest {
  /** `ESTATUS_RETIRO.AUTORIZADO` (2) o `ESTATUS_RETIRO.CANCELADO` (3). */
  idEstatus: number;
  /** Monto autorizado (puede diferir del solicitado); no aplica al rechazar. */
  montoAutorizado: number | null;
}

export class ActualizarEstatusRetiroRequestModel implements ActualizarEstatusRetiroRequest {
  idEstatus: number;
  montoAutorizado: number | null;

  constructor(data: Partial<ActualizarEstatusRetiroRequest> = {}) {
    this.idEstatus = data.idEstatus ?? ESTATUS_RETIRO.PENDIENTE;
    this.montoAutorizado = data.montoAutorizado ?? null;
  }
}
