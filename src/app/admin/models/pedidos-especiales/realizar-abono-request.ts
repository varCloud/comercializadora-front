// Body de `POST /pedidos-especiales/cuentas-por-cobrar/abonos` — registra un abono de cliente.
// `idPedidoEspecial` es opcional: si no se especifica, el SP reparte el monto FIFO entre los
// pedidos con saldo del cliente (regla de negocio 5 de la HU, lógica de servidor). `idUsuario`
// NO viaja en el request: el back lo toma del JWT (regla dura del controller, ver HU).
// Sin IVA/facturación (alcance de la HU): no se envía `idFactUsoCFDI` ni `requiereFactura`.
// Un archivo = una interfaz + su modelo (regla 09/11).
export interface RealizarAbonoRequest {
  idCliente: number;
  montoAbono: number;
  /** Comisión bancaria (formas de pago Tarjeta crédito id 4 / débito id 18); 0 en cualquier otro caso. */
  montoComision: number;
  /** Efectivo recibido; solo aplica/valida cuando `idFactFormaPago` es Efectivo (id 1). */
  montoRecibido: number;
  idFactFormaPago: number;
  /** Pedido específico seleccionado en el detalle (checkbox único); null/0 = aplica al total (FIFO). */
  idPedidoEspecial: number | null;
}

export class RealizarAbonoRequestModel implements RealizarAbonoRequest {
  idCliente: number;
  montoAbono: number;
  montoComision: number;
  montoRecibido: number;
  idFactFormaPago: number;
  idPedidoEspecial: number | null;

  constructor(data: Partial<RealizarAbonoRequest> = {}) {
    this.idCliente = data.idCliente ?? 0;
    this.montoAbono = data.montoAbono ?? 0;
    this.montoComision = data.montoComision ?? 0;
    this.montoRecibido = data.montoRecibido ?? 0;
    this.idFactFormaPago = data.idFactFormaPago ?? 0;
    this.idPedidoEspecial = data.idPedidoEspecial ?? null;
  }
}
