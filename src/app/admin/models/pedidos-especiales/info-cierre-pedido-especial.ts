// Resumen ligero de caja del día de Pedidos Especiales (`GET /api/pedidos-especiales/caja/info-cierre`,
// `SP_CONSULTA_INFO_CIERRE_PEDIDOS_ESPECIALES`). Se usa SOLO para validar el retiro de exceso de
// efectivo (`efectivoDisponible`) — NO es el resumen completo de "Cierre de Caja" (ver
// `CierrePedidoEspecialDetalle` para ese, endpoint `caja/cierre-dia`). Entidad propia — NO reusar
// `CajaInfo` de Ventas (HU `cierre_caja_pe`: SP y columnas distintas). Un archivo = una interfaz +
// su modelo (regla 11).
//
// FE-1 (corrección post-API-4): el boceto inicial de este archivo asumía el resumen completo
// (ventasContado, ventasTC, etc.) — el contrato real implementado en la API separa ese resumen en
// `CierrePedidoEspecialDetalle` (`caja/cierre-dia`) y deja este endpoint solo con los campos de
// `Models/Entities/InfoCierrePedidoEspecial.cs` (comercializadora-api).

export interface InfoCierrePedidoEspecial {
  montoApertura: number;
  montoIngresosEfectivo: number;
  totalPedidosEspeciales: number;
  montoPedidosEspecialesDelDia: number;
  efectivoDisponible: number;
  retirosExcesoEfectivo: number;
}

export class InfoCierrePedidoEspecialModel implements InfoCierrePedidoEspecial {
  montoApertura: number;
  montoIngresosEfectivo: number;
  totalPedidosEspeciales: number;
  montoPedidosEspecialesDelDia: number;
  efectivoDisponible: number;
  retirosExcesoEfectivo: number;

  constructor(data: Partial<InfoCierrePedidoEspecial> = {}) {
    this.montoApertura = data.montoApertura ?? 0;
    this.montoIngresosEfectivo = data.montoIngresosEfectivo ?? 0;
    this.totalPedidosEspeciales = data.totalPedidosEspeciales ?? 0;
    this.montoPedidosEspecialesDelDia = data.montoPedidosEspecialesDelDia ?? 0;
    this.efectivoDisponible = data.efectivoDisponible ?? 0;
    this.retirosExcesoEfectivo = data.retirosExcesoEfectivo ?? 0;
  }
}
