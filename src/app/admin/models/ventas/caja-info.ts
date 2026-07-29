// Resumen de caja/cierre del día (réplica de `Models/Cierre.cs` del legado + la respuesta de
// `ConsultaInfoCierre`/`_CierreDia.cshtml`). Alimenta tanto el resumen de cierre (FE-B3) como
// el tab de retiro por exceso de efectivo (FE-B4, valida el monto disponible en cliente).
// Un archivo = una interfaz + su modelo (regla 11).
//
// NOTA (sin API real todavía): mapea `GET /api/caja/info-cierre` según el contrato documentado
// en `task_ventas.md` (Bloque B); FE-B5 debe verificarla contra la respuesta real de `API-B4`.

export interface CajaInfo {
  idCierre: number;
  idEstacion: number;
  nombreEstacion: string;
  idUsuario: number;
  nombreUsuario: string;
  totalVentas: number;
  montoVentasDelDia: number;
  montoVentasContado: number;
  montoVentasTarjeta: number;
  montoVentasTransferencias: number;
  montoVentasOtros: number;
  montoVentasCanceladas: number;
  montoApertura: number;
  montoIngresosEfectivo: number;
  /** Retiros ya realizados en el día (exceso de efectivo), para validar tope disponible. */
  retirosHechosDia: number;
  /** Total de retiros por exceso de efectivo, para el resumen de cierre. */
  retirosExcesoEfectivo: number;
  productosDevueltos: number;
  montoTotalDevoluciones: number;
  /** Saldo total del día (ventas + ingresos − retiros − devoluciones). */
  montoCierre: number;
  /** Cantidad en efectivo disponible en caja (tope para retiros). */
  efectivoDisponible: number;
  efectivoEntregadoEnCierre: number;
}

export class CajaInfoModel implements CajaInfo {
  idCierre: number;
  idEstacion: number;
  nombreEstacion: string;
  idUsuario: number;
  nombreUsuario: string;
  totalVentas: number;
  montoVentasDelDia: number;
  montoVentasContado: number;
  montoVentasTarjeta: number;
  montoVentasTransferencias: number;
  montoVentasOtros: number;
  montoVentasCanceladas: number;
  montoApertura: number;
  montoIngresosEfectivo: number;
  retirosHechosDia: number;
  retirosExcesoEfectivo: number;
  productosDevueltos: number;
  montoTotalDevoluciones: number;
  montoCierre: number;
  efectivoDisponible: number;
  efectivoEntregadoEnCierre: number;

  constructor(data: Partial<CajaInfo> = {}) {
    this.idCierre = data.idCierre ?? 0;
    this.idEstacion = data.idEstacion ?? 0;
    this.nombreEstacion = data.nombreEstacion ?? '';
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreUsuario = data.nombreUsuario ?? '';
    this.totalVentas = data.totalVentas ?? 0;
    this.montoVentasDelDia = data.montoVentasDelDia ?? 0;
    this.montoVentasContado = data.montoVentasContado ?? 0;
    this.montoVentasTarjeta = data.montoVentasTarjeta ?? 0;
    this.montoVentasTransferencias = data.montoVentasTransferencias ?? 0;
    this.montoVentasOtros = data.montoVentasOtros ?? 0;
    this.montoVentasCanceladas = data.montoVentasCanceladas ?? 0;
    this.montoApertura = data.montoApertura ?? 0;
    this.montoIngresosEfectivo = data.montoIngresosEfectivo ?? 0;
    this.retirosHechosDia = data.retirosHechosDia ?? 0;
    this.retirosExcesoEfectivo = data.retirosExcesoEfectivo ?? 0;
    this.productosDevueltos = data.productosDevueltos ?? 0;
    this.montoTotalDevoluciones = data.montoTotalDevoluciones ?? 0;
    this.montoCierre = data.montoCierre ?? 0;
    this.efectivoDisponible = data.efectivoDisponible ?? 0;
    this.efectivoEntregadoEnCierre = data.efectivoEntregadoEnCierre ?? 0;
  }
}
