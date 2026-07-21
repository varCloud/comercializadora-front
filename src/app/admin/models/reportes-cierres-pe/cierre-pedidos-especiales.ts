// Fila del listado de "Reportes > Cierres de Pedidos Especiales" (paridad de campos con
// `CierrePedidosEspeciales` del back-end, que a su vez migra `Models/CierrePedidosEspeciales.cs`
// / `SP_REPORTE_CIERRES_PEDIDOS_ESPECIALES` del legado — sin paginación server-side, un solo
// resultset). Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato
// JSON de la API (camelCase, regla 09).

export interface CierrePedidosEspeciales {
  idCierrePedidoEspecial: number;
  fechaCierre: string;
  nombreUsuario: string;
  ventasContado: number;
  ventasTC: number;
  ventasTransferencias: number;
  ventasOtrasFormasPago: number;
  ventasCredito: number;
  montoDevoluciones: number;
  montoIngresosEfectivo: number;
  montoRetirosEfectivo: number;
  montoCierreEfectivo: number;
  montoCierreTC: number;
  efectivoEntregadoEnCierre: number;
  noDevoluciones: number;
  noTicketsEfectivo: number;
  noTicketsCredito: number;
  noPedidosEnResguardo: number;
  totalEfectivo: number;
  abonosEfectivo: number;
}

export class CierrePedidosEspecialesModel implements CierrePedidosEspeciales {
  idCierrePedidoEspecial: number;
  fechaCierre: string;
  nombreUsuario: string;
  ventasContado: number;
  ventasTC: number;
  ventasTransferencias: number;
  ventasOtrasFormasPago: number;
  ventasCredito: number;
  montoDevoluciones: number;
  montoIngresosEfectivo: number;
  montoRetirosEfectivo: number;
  montoCierreEfectivo: number;
  montoCierreTC: number;
  efectivoEntregadoEnCierre: number;
  noDevoluciones: number;
  noTicketsEfectivo: number;
  noTicketsCredito: number;
  noPedidosEnResguardo: number;
  totalEfectivo: number;
  abonosEfectivo: number;

  constructor(data: Partial<CierrePedidosEspeciales> = {}) {
    this.idCierrePedidoEspecial = data.idCierrePedidoEspecial ?? 0;
    this.fechaCierre = data.fechaCierre ?? '';
    this.nombreUsuario = data.nombreUsuario ?? '';
    this.ventasContado = data.ventasContado ?? 0;
    this.ventasTC = data.ventasTC ?? 0;
    this.ventasTransferencias = data.ventasTransferencias ?? 0;
    this.ventasOtrasFormasPago = data.ventasOtrasFormasPago ?? 0;
    this.ventasCredito = data.ventasCredito ?? 0;
    this.montoDevoluciones = data.montoDevoluciones ?? 0;
    this.montoIngresosEfectivo = data.montoIngresosEfectivo ?? 0;
    this.montoRetirosEfectivo = data.montoRetirosEfectivo ?? 0;
    this.montoCierreEfectivo = data.montoCierreEfectivo ?? 0;
    this.montoCierreTC = data.montoCierreTC ?? 0;
    this.efectivoEntregadoEnCierre = data.efectivoEntregadoEnCierre ?? 0;
    this.noDevoluciones = data.noDevoluciones ?? 0;
    this.noTicketsEfectivo = data.noTicketsEfectivo ?? 0;
    this.noTicketsCredito = data.noTicketsCredito ?? 0;
    this.noPedidosEnResguardo = data.noPedidosEnResguardo ?? 0;
    this.totalEfectivo = data.totalEfectivo ?? 0;
    this.abonosEfectivo = data.abonosEfectivo ?? 0;
  }
}
