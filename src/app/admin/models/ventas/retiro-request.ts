// Payload para registrar un retiro por exceso de efectivo (`POST /api/caja/retiro`), réplica de
// `retirarExcesoEfectivo()` en `EvtVentas.js`. Un archivo = una interfaz + su modelo (regla 11).

export interface RetiroRequest {
  monto: number;
}

export class RetiroRequestModel implements RetiroRequest {
  monto: number;

  constructor(data: Partial<RetiroRequest> = {}) {
    this.monto = data.monto ?? 0;
  }
}
