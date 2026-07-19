// Payload de POST /api/facturas/pedidos-especiales/cancelar. Hermano de
// CancelarFacturaRequest (ventas), cambia el identificador. Un archivo = una interfaz + su
// modelo (regla 11).

export interface CancelarFacturaPeRequest {
  idPedidoEspecial: number;
}

export class CancelarFacturaPeRequestModel implements CancelarFacturaPeRequest {
  idPedidoEspecial: number;

  constructor(data: Partial<CancelarFacturaPeRequest> = {}) {
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
  }
}
