// Paso del timeline de un pedido interno (historial de cambios de estatus), tal como lo
// devuelve la API (GET /api/bitacoras/{id}/detalle, resultset de
// SP_V2_CONSULTA_DETALLE_PEDIDOS_INTERNOS). Un archivo = una interfaz + su modelo (regla 11).
// El "tiempo transcurrido" entre pasos lo calcula el front a partir de `fechaAlta`.

export interface BitacoraDetalle {
  idPedidoInterno: number;
  fechaAlta: string | null;
  observacion: string | null;
  idAlmacenOrigen: number;
  almacenOrigen: string | null;
  idAlmacenDestino: number;
  almacenDestino: string | null;
  idUsuario: number;
  nombreCompleto: string | null;
  idStatus: number;
  descripcionEstatus: string | null;
}

export class BitacoraDetalleModel implements BitacoraDetalle {
  idPedidoInterno: number;
  fechaAlta: string | null;
  observacion: string | null;
  idAlmacenOrigen: number;
  almacenOrigen: string | null;
  idAlmacenDestino: number;
  almacenDestino: string | null;
  idUsuario: number;
  nombreCompleto: string | null;
  idStatus: number;
  descripcionEstatus: string | null;

  constructor(data: Partial<BitacoraDetalle> = {}) {
    this.idPedidoInterno = data.idPedidoInterno ?? 0;
    this.fechaAlta = data.fechaAlta ?? null;
    this.observacion = data.observacion ?? null;
    this.idAlmacenOrigen = data.idAlmacenOrigen ?? 0;
    this.almacenOrigen = data.almacenOrigen ?? null;
    this.idAlmacenDestino = data.idAlmacenDestino ?? 0;
    this.almacenDestino = data.almacenDestino ?? null;
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreCompleto = data.nombreCompleto ?? null;
    this.idStatus = data.idStatus ?? 0;
    this.descripcionEstatus = data.descripcionEstatus ?? null;
  }
}
