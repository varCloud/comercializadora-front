// Resumen de caja/cierre del día (`GET /api/caja/info-cierre`, entidad `InfoCierre` de
// `comercializadora-api`, SP_CONSULTA_INFO_CIERRE). Alimenta tanto el resumen de cierre (FE-B3)
// como el tab de retiro por exceso de efectivo (FE-B4, valida el monto disponible en cliente).
// Un archivo = una interfaz + su modelo (regla 11).
//
// FE-B5 (integración real): el SP real NO regresa idCierre/idEstacion/nombreEstacion/idUsuario/
// nombreUsuario/efectivoEntregadoEnCierre (eran suposiciones del mock, sin respaldo en
// `Models/Entities/InfoCierre.cs`) — se quitaron. `efectivoDisponible` viene YA NETO de los
// retiros del día (misma fórmula que usa `SP_RETIRA_EFECTIVO` para validar el tope, confirmado en
// `CajaService.RetirarAsync`), así que ya NO existe un campo `retirosHechosDia` aparte para
// restar: se usa `retirosExcesoEfectivo` (informativo) y `efectivoDisponible` tal cual para el
// tope de retiro.

export interface CajaInfo {
  totalVentas: number;
  montoVentasDelDia: number;
  montoVentasContado: number;
  montoVentasTarjeta: number;
  montoVentasTransferencias: number;
  montoVentasOtros: number;
  montoVentasCanceladas: number;
  montoApertura: number;
  montoIngresosEfectivo: number;
  /** Total de retiros por exceso de efectivo ya realizados hoy (informativo). */
  retirosExcesoEfectivo: number;
  productosDevueltos: number;
  montoTotalDevoluciones: number;
  /** Saldo total del día (ventas + ingresos − retiros − devoluciones). */
  montoCierre: number;
  /** Efectivo disponible en caja AHORA (ya neto de retiros del día); tope real para retirar/cerrar. */
  efectivoDisponible: number;
}

export class CajaInfoModel implements CajaInfo {
  totalVentas: number;
  montoVentasDelDia: number;
  montoVentasContado: number;
  montoVentasTarjeta: number;
  montoVentasTransferencias: number;
  montoVentasOtros: number;
  montoVentasCanceladas: number;
  montoApertura: number;
  montoIngresosEfectivo: number;
  retirosExcesoEfectivo: number;
  productosDevueltos: number;
  montoTotalDevoluciones: number;
  montoCierre: number;
  efectivoDisponible: number;

  constructor(data: Partial<CajaInfo> = {}) {
    this.totalVentas = data.totalVentas ?? 0;
    this.montoVentasDelDia = data.montoVentasDelDia ?? 0;
    this.montoVentasContado = data.montoVentasContado ?? 0;
    this.montoVentasTarjeta = data.montoVentasTarjeta ?? 0;
    this.montoVentasTransferencias = data.montoVentasTransferencias ?? 0;
    this.montoVentasOtros = data.montoVentasOtros ?? 0;
    this.montoVentasCanceladas = data.montoVentasCanceladas ?? 0;
    this.montoApertura = data.montoApertura ?? 0;
    this.montoIngresosEfectivo = data.montoIngresosEfectivo ?? 0;
    this.retirosExcesoEfectivo = data.retirosExcesoEfectivo ?? 0;
    this.productosDevueltos = data.productosDevueltos ?? 0;
    this.montoTotalDevoluciones = data.montoTotalDevoluciones ?? 0;
    this.montoCierre = data.montoCierre ?? 0;
    this.efectivoDisponible = data.efectivoDisponible ?? 0;
  }
}
