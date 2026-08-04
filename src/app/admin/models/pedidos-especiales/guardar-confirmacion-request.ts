// Confirma los productos entregados de un pedido especial
// (POST /pedidos-especiales/{folio}/confirmacion). Mapea 1:1 `GuardarConfirmacionRequest` de
// comercializadora-api. `idUsuarioEntrega`/`idUsuarioLiquida` NUNCA viajan aquí: el backend los
// resuelve del JWT (ver el DTO real en la API). Un archivo = una interfaz + su modelo
// (regla 09/11).
//
// **No existe endpoint "aceptar/rechazar" separado**: esa transición, igual que la liquidación
// de un pedido en ruta, se resuelve aquí cambiando `idEstatusPedidoEspecial` — ver
// `ConfirmarProductosComponent.resolverIdEstatusPedidoEspecial()` para la réplica exacta de la
// regla del legado (`EvtConfirmarProductosV2.js`, evento `#btnEntregarPedidoEspecial`):
// - `tipoPago === 'liquidado'`: `idEstatusPedidoEspecial` = 6 (entregado a Cliente) / 4 (a
//   Ruteo o Taxi).
// - `tipoPago` a crédito (con o sin abono): `idEstatusPedidoEspecial` = 7 (a Cliente) / 5 (a
//   Ruteo o Taxi).
// - Si se entrega a Encargado de Ruteo (`entregadoARuteo`), el legado **sobrescribe** lo
//   anterior con `idEstatusPedidoEspecial = 9` ("Pedido en Ruta"), sin importar el tipo de pago.
//
// `esPedidoEnRuta` distingue la confirmación inicial de entrega (Bloque B,
// `ConfirmarProductosComponent` llegando desde "Entregar Pedido" → `false`) de la
// **liquidación posterior** de un pedido ya enviado a ruta (Bloque C, "Pedidos en Ruta" →
// "Liquidar Pedido" → `true`, propagado vía query param `esPedidoEnRuta` de la navegación de
// `PedidosEnRutaComponent.liquidar()`). Solo en el segundo caso el backend calcula
// `idUsuarioLiquida`.

import {
  ConfirmacionProductoRequest,
  ConfirmacionProductoRequestModel,
} from 'src/app/admin/models/pedidos-especiales/confirmacion-producto-request';

export interface GuardarConfirmacionRequest {
  productos: ConfirmacionProductoRequest[];
  idEstatusPedidoEspecial: number;
  numeroUnidadTaxi: string | null;
  idEstatusCuentaPorCobrar: number;
  montoPagado: number;
  aCredito: boolean;
  aCreditoConAbono: boolean;
  aplicaIVA: boolean;
  idFactFormaPago: number;
  idFactUsoCfdi: number;
  observacionesPedidoRuta: string | null;
  idUsuarioRuteo: number;
  esPedidoEnRuta: boolean;
}

export class GuardarConfirmacionRequestModel implements GuardarConfirmacionRequest {
  productos: ConfirmacionProductoRequest[];
  idEstatusPedidoEspecial: number;
  numeroUnidadTaxi: string | null;
  idEstatusCuentaPorCobrar: number;
  montoPagado: number;
  aCredito: boolean;
  aCreditoConAbono: boolean;
  aplicaIVA: boolean;
  idFactFormaPago: number;
  idFactUsoCfdi: number;
  observacionesPedidoRuta: string | null;
  idUsuarioRuteo: number;
  esPedidoEnRuta: boolean;

  constructor(data: Partial<GuardarConfirmacionRequest> = {}) {
    this.productos = (data.productos ?? []).map((p) => new ConfirmacionProductoRequestModel(p));
    this.idEstatusPedidoEspecial = data.idEstatusPedidoEspecial ?? 0;
    this.numeroUnidadTaxi = data.numeroUnidadTaxi ?? '0';
    this.idEstatusCuentaPorCobrar = data.idEstatusCuentaPorCobrar ?? 0;
    this.montoPagado = data.montoPagado ?? 0;
    this.aCredito = data.aCredito ?? false;
    this.aCreditoConAbono = data.aCreditoConAbono ?? false;
    this.aplicaIVA = data.aplicaIVA ?? false;
    this.idFactFormaPago = data.idFactFormaPago ?? 0;
    this.idFactUsoCfdi = data.idFactUsoCfdi ?? 0;
    this.observacionesPedidoRuta = data.observacionesPedidoRuta ?? null;
    this.idUsuarioRuteo = data.idUsuarioRuteo ?? 0;
    this.esPedidoEnRuta = data.esPedidoEnRuta ?? false;
  }
}
