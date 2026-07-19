// Renglón del listado "Facturas Ventas", tal como lo devuelve la API
// (GET /api/facturas, resultset de página de SP_V2_CONSULTA_FACTURAS).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON de la API.

export interface FacturaVenta {
  idFactura: number;
  idVenta: number;
  fecha: string | null;
  fechaTimbrado: string | null;
  uuid: string | null;
  /** 1 Facturada, 2 Cancelada, 3 Error, 4 En proceso de cancelación (ver EstatusFacturaId). */
  idEstatusFactura: number;
  descripcion: string | null;
  nombreCliente: string | null;
  nombreUsuarioFacturacion: string | null;
  nombreUsuarioCancelacion: string | null;
  fechaCancelacion: string | null;
  /** Mensaje de error de facturación/cancelación (tooltip en el listado). */
  mensajeError: string | null;
  codigoBarras: string | null;
  /** Monto total CON impuestos (a diferencia de DetalleVentaFactura.total, que es sin IVA). */
  montoTotal: number;
  /** URL lista para `window.open` (ya trae el dominio aplicado por el back). */
  pathArchivoFactura: string | null;
}

export class FacturaVentaModel implements FacturaVenta {
  idFactura: number;
  idVenta: number;
  fecha: string | null;
  fechaTimbrado: string | null;
  uuid: string | null;
  idEstatusFactura: number;
  descripcion: string | null;
  nombreCliente: string | null;
  nombreUsuarioFacturacion: string | null;
  nombreUsuarioCancelacion: string | null;
  fechaCancelacion: string | null;
  mensajeError: string | null;
  codigoBarras: string | null;
  montoTotal: number;
  pathArchivoFactura: string | null;

  constructor(data: Partial<FacturaVenta> = {}) {
    this.idFactura = data.idFactura ?? 0;
    this.idVenta = data.idVenta ?? 0;
    this.fecha = data.fecha ?? null;
    this.fechaTimbrado = data.fechaTimbrado ?? null;
    this.uuid = data.uuid ?? null;
    this.idEstatusFactura = data.idEstatusFactura ?? 0;
    this.descripcion = data.descripcion ?? null;
    this.nombreCliente = data.nombreCliente ?? null;
    this.nombreUsuarioFacturacion = data.nombreUsuarioFacturacion ?? null;
    this.nombreUsuarioCancelacion = data.nombreUsuarioCancelacion ?? null;
    this.fechaCancelacion = data.fechaCancelacion ?? null;
    this.mensajeError = data.mensajeError ?? null;
    this.codigoBarras = data.codigoBarras ?? null;
    this.montoTotal = data.montoTotal ?? 0;
    this.pathArchivoFactura = data.pathArchivoFactura ?? null;
  }
}
