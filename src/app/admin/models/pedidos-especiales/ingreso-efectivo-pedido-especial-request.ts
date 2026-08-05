// Payload para registrar apertura de caja o ingreso de efectivo de Pedidos Especiales
// (`POST /api/pedidos-especiales/caja/ingreso-efectivo`, contrato tentativo documentado en
// `task_cierre_caja_pe.md`). Réplica de `IngresoEfectivo` (legado, región `IngresoEfectivo` de
// `PedidosEspecialesV2Controller`): un mismo endpoint cubre apertura e ingreso normal,
// diferenciados por `idTipoIngreso`. Un archivo = una interfaz + su modelo (regla 11).
//
// NOTA (FE-1, sin FE-2/API real conectada todavía): nombres de campo tal como documenta el
// contrato tentativo de `task_cierre_caja_pe.md`. Verificar contra el DTO real del back-end
// cuando FE-2 conecte el servicio HTTP (puede ajustar levemente, ver nota del task).

import { TipoIngresoPedidoEspecialId } from './tipo-ingreso-pedido-especial';

export interface IngresoEfectivoPedidoEspecialRequest {
  monto: number;
  idTipoIngreso: TipoIngresoPedidoEspecialId;
}

export class IngresoEfectivoPedidoEspecialRequestModel implements IngresoEfectivoPedidoEspecialRequest {
  monto: number;
  idTipoIngreso: TipoIngresoPedidoEspecialId;

  constructor(data: Partial<IngresoEfectivoPedidoEspecialRequest> = {}) {
    this.monto = data.monto ?? 0;
    this.idTipoIngreso = data.idTipoIngreso ?? TipoIngresoPedidoEspecialId.IngresoEfectivo;
  }
}
