// Fila de devolución o complemento asociada a una venta (GET /ventas/{id}/devoluciones-
// complementos, Bloque C). Mapea 1:1 la entidad `VentaDevolucionComplemento` de
// comercializadora-api. El SP origen expone DOS shapes según el tipo de ticket: la devolución
// trae `observaciones` (motivo); el complemento no (queda en `null`). Un archivo = una
// interfaz + su modelo (regla 11).

export interface VentaDevolucionComplemento {
  contador: number;
  idDevolucion: number;
  idComplemento: number;
  idVenta: number;
  idUsuario: number;
  idCliente: number;
  cantidad: number;
  fechaAlta: string;
  montoTotal: number;
  idFactFormaPago: number;
  idEstacion: number;
  /** Solo presente en filas de devolución (motivo). Null en complementos. */
  observaciones: string | null;
}

export class VentaDevolucionComplementoModel implements VentaDevolucionComplemento {
  contador: number;
  idDevolucion: number;
  idComplemento: number;
  idVenta: number;
  idUsuario: number;
  idCliente: number;
  cantidad: number;
  fechaAlta: string;
  montoTotal: number;
  idFactFormaPago: number;
  idEstacion: number;
  observaciones: string | null;

  constructor(data: Partial<VentaDevolucionComplemento> = {}) {
    this.contador = data.contador ?? 0;
    this.idDevolucion = data.idDevolucion ?? 0;
    this.idComplemento = data.idComplemento ?? 0;
    this.idVenta = data.idVenta ?? 0;
    this.idUsuario = data.idUsuario ?? 0;
    this.idCliente = data.idCliente ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.fechaAlta = data.fechaAlta ?? '';
    this.montoTotal = data.montoTotal ?? 0;
    this.idFactFormaPago = data.idFactFormaPago ?? 0;
    this.idEstacion = data.idEstacion ?? 0;
    this.observaciones = data.observaciones ?? null;
  }
}
