// Fila del resumen de "Cierre de Caja" de Pedidos Especiales (`GET
// /api/pedidos-especiales/caja/cierre-dia`, `SP_CONSULTA_CIERRE_PEDIDOS_ESPECIALES`). El SP
// regresa UNA fila por categoría/almacén (`idAlmacen`/`descripcion`) con los campos de
// encabezado del cierre (montos de ingresos/retiros/saldo del día, conteos) repetidos en cada
// fila — igual de denormalizado que `CierrePedidosEspeciales` del legado (el front toma la fila
// [0] para el encabezado y recorre todas para las líneas de categoría). Llamar a este endpoint
// (pantalla "Cierre de Caja") tiene un efecto colateral: si no existe un cierre pendiente del día
// lo crea/recalcula (ver `CierrePedidoEspecialDetalle.cs`, comercializadora-api). Entidad propia
// — NO reusar `Cierre` (reporte "Reportes > Cierres") ni `InfoCierrePedidoEspecial` (validación
// de retiro). Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON
// de la API (camelCase, regla 09).

export interface CierrePedidoEspecialDetalle {
  idCierrePedidoEspecial: number;
  fechaAlta: string | null;
  fechaTicket: string | null;
  horaTicket: string | null;
  montoIngresosEfectivo: number;
  montoRetirosEfectivo: number;
  montoCierreEfectivo: number;
  montoCierreTC: number;
  efectivoEntregadoEnCierre: number;
  noDevoluciones: number;
  noTicketsEfectivo: number;
  noTicketsCredito: number;
  noPedidosEnResguardo: number;
  noPedidosEnRuta: number;
  cajaCerrada: boolean;
  idAlmacen: number;
  /** Descripción de la categoría/línea de este renglón (ej. "Ventas Abarrotes", "Ingresos por pagos crédito"). */
  descripcion: string | null;
  descripcionSaldo: string | null;
  ventasContado: number;
  ventasTC: number;
  ventasTransferencias: number;
  ventasOtrasFormasPago: number;
  ventasCredito: number;
  ventasTDCTransferencias: number;
  montoDevoluciones: number;
  totalEfectivo: number;
  abonosEfectivo: number;
  totalCreditoTransferencias: number;
  nombreUsuario: string | null;
  descripcionSucursal: string | null;
  descripcionAlmacen: string | null;
  nombreEstacion: string | null;
}

export class CierrePedidoEspecialDetalleModel implements CierrePedidoEspecialDetalle {
  idCierrePedidoEspecial: number;
  fechaAlta: string | null;
  fechaTicket: string | null;
  horaTicket: string | null;
  montoIngresosEfectivo: number;
  montoRetirosEfectivo: number;
  montoCierreEfectivo: number;
  montoCierreTC: number;
  efectivoEntregadoEnCierre: number;
  noDevoluciones: number;
  noTicketsEfectivo: number;
  noTicketsCredito: number;
  noPedidosEnResguardo: number;
  noPedidosEnRuta: number;
  cajaCerrada: boolean;
  idAlmacen: number;
  descripcion: string | null;
  descripcionSaldo: string | null;
  ventasContado: number;
  ventasTC: number;
  ventasTransferencias: number;
  ventasOtrasFormasPago: number;
  ventasCredito: number;
  ventasTDCTransferencias: number;
  montoDevoluciones: number;
  totalEfectivo: number;
  abonosEfectivo: number;
  totalCreditoTransferencias: number;
  nombreUsuario: string | null;
  descripcionSucursal: string | null;
  descripcionAlmacen: string | null;
  nombreEstacion: string | null;

  constructor(data: Partial<CierrePedidoEspecialDetalle> = {}) {
    this.idCierrePedidoEspecial = data.idCierrePedidoEspecial ?? 0;
    this.fechaAlta = data.fechaAlta ?? null;
    this.fechaTicket = data.fechaTicket ?? null;
    this.horaTicket = data.horaTicket ?? null;
    this.montoIngresosEfectivo = data.montoIngresosEfectivo ?? 0;
    this.montoRetirosEfectivo = data.montoRetirosEfectivo ?? 0;
    this.montoCierreEfectivo = data.montoCierreEfectivo ?? 0;
    this.montoCierreTC = data.montoCierreTC ?? 0;
    this.efectivoEntregadoEnCierre = data.efectivoEntregadoEnCierre ?? 0;
    this.noDevoluciones = data.noDevoluciones ?? 0;
    this.noTicketsEfectivo = data.noTicketsEfectivo ?? 0;
    this.noTicketsCredito = data.noTicketsCredito ?? 0;
    this.noPedidosEnResguardo = data.noPedidosEnResguardo ?? 0;
    this.noPedidosEnRuta = data.noPedidosEnRuta ?? 0;
    this.cajaCerrada = data.cajaCerrada ?? false;
    this.idAlmacen = data.idAlmacen ?? 0;
    this.descripcion = data.descripcion ?? null;
    this.descripcionSaldo = data.descripcionSaldo ?? null;
    this.ventasContado = data.ventasContado ?? 0;
    this.ventasTC = data.ventasTC ?? 0;
    this.ventasTransferencias = data.ventasTransferencias ?? 0;
    this.ventasOtrasFormasPago = data.ventasOtrasFormasPago ?? 0;
    this.ventasCredito = data.ventasCredito ?? 0;
    this.ventasTDCTransferencias = data.ventasTDCTransferencias ?? 0;
    this.montoDevoluciones = data.montoDevoluciones ?? 0;
    this.totalEfectivo = data.totalEfectivo ?? 0;
    this.abonosEfectivo = data.abonosEfectivo ?? 0;
    this.totalCreditoTransferencias = data.totalCreditoTransferencias ?? 0;
    this.nombreUsuario = data.nombreUsuario ?? null;
    this.descripcionSucursal = data.descripcionSucursal ?? null;
    this.descripcionAlmacen = data.descripcionAlmacen ?? null;
    this.nombreEstacion = data.nombreEstacion ?? null;
  }
}
