// Tipo de ingreso de efectivo de Pedidos Especiales (mapea el parámetro `idTipoIngresoEfectivo`
// de la acción `IngresoEfectivo`, región `IngresoEfectivo` de `PedidosEspecialesV2Controller`
// legado): un mismo endpoint/formulario cubre Apertura de Caja (tipo 1) e Ingreso de Efectivo
// normal durante el turno (otro valor) — ver HU `cierre_caja_pe`. Entidad propia del módulo, NO
// reusar `TipoIngresoEfectivoId` de Ventas (mismo concepto, SP/columnas distintas). Se serializa
// como número.

export enum TipoIngresoPedidoEspecialId {
  /** Apertura de caja de Pedidos Especiales. */
  AperturaCaja = 1,
  /** Ingreso de efectivo "libre" durante el turno (solicitud de efectivo). */
  IngresoEfectivo = 2,
}
