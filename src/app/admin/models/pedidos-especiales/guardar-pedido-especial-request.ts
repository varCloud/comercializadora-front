// Alta/edición de un pedido especial (POST /pedidos-especiales). Mapea 1:1
// `GuardarPedidoEspecialRequest` de comercializadora-api. `idUsuario`/`idEstacion` NUNCA viajan
// aquí: los resuelve el backend del JWT. Un archivo = una interfaz + su modelo (regla 09/11).
//
// Esta pantalla (FE-A5) solo cubre el flujo "revisión por ticket" del legado
// (`GuardarPedidoEspecial(1, 1)` en `EvtPedidosEspecialesV2.js`): `tipoRevision = 1`,
// `idEstatusPedidoEspecial = 1`, siempre alta nueva (`idPedidoEspecial = 0`) y sin
// autorización de precio de mayoreo (`idPedidoEspecialMayoreo = 0`). Los flujos "Hand Held"
// (tipoRevision 2) y "Cotización" (tipoRevision 3, idEstatusPedidoEspecial 2) quedan fuera de
// alcance de esta HU (Bloques B/C/D posteriores) — ver duda para el revisor.

import {
  PedidoEspecialProductoRequest,
  PedidoEspecialProductoRequestModel,
} from 'src/app/admin/models/pedidos-especiales/pedido-especial-producto-request';

export interface GuardarPedidoEspecialRequest {
  productos: PedidoEspecialProductoRequest[];
  /** 1 = revisión por ticket, 2 = revisión por Hand Held, 3 = cotización. */
  tipoRevision: number;
  idCliente: number;
  idEstatusPedidoEspecial: number;
  /** 0 = alta nueva; > 0 al editar una cotización existente (no implementado en esta pantalla). */
  idPedidoEspecial: number;
  idPedidoEspecialMayoreo: number;
}

export class GuardarPedidoEspecialRequestModel implements GuardarPedidoEspecialRequest {
  productos: PedidoEspecialProductoRequest[];
  tipoRevision: number;
  idCliente: number;
  idEstatusPedidoEspecial: number;
  idPedidoEspecial: number;
  idPedidoEspecialMayoreo: number;

  constructor(data: Partial<GuardarPedidoEspecialRequest> = {}) {
    this.productos = (data.productos ?? []).map((p) => new PedidoEspecialProductoRequestModel(p));
    this.tipoRevision = data.tipoRevision ?? 0;
    this.idCliente = data.idCliente ?? 0;
    this.idEstatusPedidoEspecial = data.idEstatusPedidoEspecial ?? 0;
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
    this.idPedidoEspecialMayoreo = data.idPedidoEspecialMayoreo ?? 0;
  }
}
