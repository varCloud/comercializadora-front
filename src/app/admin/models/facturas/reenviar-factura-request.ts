// Payload de POST /api/facturas/reenviar. Un archivo = una interfaz + su modelo (regla 11).

export interface ReenviarFacturaRequest {
  idVenta: number;
  /** Correo adicional en copia (opcional). */
  correoCopia: string | null;
}

export class ReenviarFacturaRequestModel implements ReenviarFacturaRequest {
  idVenta: number;
  correoCopia: string | null;

  constructor(data: Partial<ReenviarFacturaRequest> = {}) {
    this.idVenta = data.idVenta ?? 0;
    this.correoCopia = data.correoCopia ?? null;
  }
}
