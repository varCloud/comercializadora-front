// Payload de "ajustar IVA" de una venta (POST /ventas/{id}/iva, Bloque C). Mapea 1:1 el DTO
// `GuardarIvaRequest` de comercializadora-api. `idVenta` viaja en la ruta, no en el body.
// Un archivo = una interfaz + su modelo (regla 11).

export interface GuardarIvaRequest {
  montoIva: number;
  idCliente: number;
  idFactFormaPago: number;
  idFactUsoCfdi: number;
}

export class GuardarIvaRequestModel implements GuardarIvaRequest {
  montoIva: number;
  idCliente: number;
  idFactFormaPago: number;
  idFactUsoCfdi: number;

  constructor(data: Partial<GuardarIvaRequest> = {}) {
    this.montoIva = data.montoIva ?? 0;
    this.idCliente = data.idCliente ?? 0;
    this.idFactFormaPago = data.idFactFormaPago ?? 0;
    this.idFactUsoCfdi = data.idFactUsoCfdi ?? 0;
  }
}
