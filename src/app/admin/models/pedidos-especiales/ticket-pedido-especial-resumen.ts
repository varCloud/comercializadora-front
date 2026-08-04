// Fila del listado de tickets históricos de un pedido especial (Bloque D — `GET
// /pedidos-especiales/{folio}/tickets`, mapea `TicketPedidoEspecialResumen` de
// comercializadora-api). Réplica de solo datos de la acción `Tickets`/
// `_ObtenerTicketsPedidoEspecial` del legado — la API expone el listado como JSON crudo (sin
// regenerar el PDF de cada ticket; ver nota de la tarea Bloque D), así que aquí solo se consume
// para mostrar el listado (folio/tipo/fecha/monto), sin detalle de líneas ni impresión. Un
// archivo = una interfaz + su modelo (regla 09/11).
export interface TicketPedidoEspecialResumen {
  idTicketPedidoEspecial: number;
  idTipoTicketPedidoEspecial: number;
  idPedidoEspecial: number;
  cantidad: number;
  monto: number;
  montoIVA: number;
  montoTotal: number;
  observaciones: string | null;
  /** Fecha formateada "dd/mm/aaaa hh:mm:ss" que ya arma el SP. */
  fechaTicket: string | null;
  /** Descripción del tipo de ticket (1=original, 2=devolución, 3=pedido en ruta). */
  tipoTicket: string | null;
}

export class TicketPedidoEspecialResumenModel implements TicketPedidoEspecialResumen {
  idTicketPedidoEspecial: number;
  idTipoTicketPedidoEspecial: number;
  idPedidoEspecial: number;
  cantidad: number;
  monto: number;
  montoIVA: number;
  montoTotal: number;
  observaciones: string | null;
  fechaTicket: string | null;
  tipoTicket: string | null;

  constructor(data: Partial<TicketPedidoEspecialResumen> = {}) {
    this.idTicketPedidoEspecial = data.idTicketPedidoEspecial ?? 0;
    this.idTipoTicketPedidoEspecial = data.idTipoTicketPedidoEspecial ?? 0;
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.monto = data.monto ?? 0;
    this.montoIVA = data.montoIVA ?? 0;
    this.montoTotal = data.montoTotal ?? 0;
    this.observaciones = data.observaciones ?? null;
    this.fechaTicket = data.fechaTicket ?? null;
    this.tipoTicket = data.tipoTicket ?? null;
  }
}
