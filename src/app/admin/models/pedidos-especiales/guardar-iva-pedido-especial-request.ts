// Ajusta el IVA/datos fiscales de un pedido especial (PUT /pedidos-especiales/{folio}/iva).
// Mapea 1:1 `GuardarIvaPedidoEspecialRequest` de comercializadora-api. `idPedidoEspecial`
// (folio) viaja en la ruta, no en el body — igual que `GuardarIvaRequest` de Ventas.
// Un archivo = una interfaz + su modelo (regla 09/11).
//
// A diferencia de `GuardarIvaRequest` (Ventas), este DTO NO tiene `montoIva`: el ajuste manual
// de IVA que muestra esta pantalla (botón "Ajustar IVA") es solo una vista previa local del
// total antes de guardar — el backend no expone un campo para persistir un monto de IVA
// distinto al que calcule el SP a partir de estos mismos datos fiscales (ver duda al revisor).

export interface GuardarIvaPedidoEspecialRequest {
  idCliente: number;
  idFactFormaPago: number;
  idFactUsoCfdi: number;
}

export class GuardarIvaPedidoEspecialRequestModel implements GuardarIvaPedidoEspecialRequest {
  idCliente: number;
  idFactFormaPago: number;
  idFactUsoCfdi: number;

  constructor(data: Partial<GuardarIvaPedidoEspecialRequest> = {}) {
    this.idCliente = data.idCliente ?? 0;
    this.idFactFormaPago = data.idFactFormaPago ?? 0;
    this.idFactUsoCfdi = data.idFactUsoCfdi ?? 0;
  }
}
