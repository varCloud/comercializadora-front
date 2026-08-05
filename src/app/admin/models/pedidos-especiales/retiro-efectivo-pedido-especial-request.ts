// Payload para registrar un retiro de exceso de efectivo de Pedidos Especiales
// (`POST /api/pedidos-especiales/caja/retiro-efectivo`, contrato tentativo documentado en
// `task_cierre_caja_pe.md`). Réplica de `RetirarExcesoEfectivo` (legado, región
// `RetiroExcesoEfectivo` de `PedidosEspecialesV2Controller`). Un archivo = una interfaz + su
// modelo (regla 11).
//
// NOTA (FE-1, sin FE-2/API real conectada todavía): la HU aclara que estos montos NO llevan IVA
// ni comisión bancaria (a diferencia del abono de Cuentas por Cobrar) — a confirmar contra el SP
// real en API-2, sin cálculos adicionales asumidos aquí.

export interface RetiroEfectivoPedidoEspecialRequest {
  monto: number;
}

export class RetiroEfectivoPedidoEspecialRequestModel implements RetiroEfectivoPedidoEspecialRequest {
  monto: number;

  constructor(data: Partial<RetiroEfectivoPedidoEspecialRequest> = {}) {
    this.monto = data.monto ?? 0;
  }
}
