// Payload de POST /api/facturas/cancelar. Un archivo = una interfaz + su modelo (regla 11).

export interface CancelarFacturaRequest {
  idVenta: number;
}

export class CancelarFacturaRequestModel implements CancelarFacturaRequest {
  idVenta: number;

  constructor(data: Partial<CancelarFacturaRequest> = {}) {
    this.idVenta = data.idVenta ?? 0;
  }
}
