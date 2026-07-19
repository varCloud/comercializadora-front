// Payload de POST /api/facturas/pedidos-especiales/reenviar. Hermano de ReenviarFacturaRequest
// (ventas), cambia el identificador. Un archivo = una interfaz + su modelo (regla 11).

export interface ReenviarFacturaPeRequest {
  idPedidoEspecial: number;
  /** Correo adicional en copia (opcional). */
  correoCopia: string | null;
}

export class ReenviarFacturaPeRequestModel implements ReenviarFacturaPeRequest {
  idPedidoEspecial: number;
  correoCopia: string | null;

  constructor(data: Partial<ReenviarFacturaPeRequest> = {}) {
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
    this.correoCopia = data.correoCopia ?? null;
  }
}
