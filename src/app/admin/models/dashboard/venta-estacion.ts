// Venta por estación tal como la devuelve la API (dashboard/ventas-por-estacion).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON español.

export interface EstacionVenta {
  idEstacion: number;
  nombre: string;
  numero: number;
  idAlmacen: number;
  nombreAlmacen: string;
  montoTotalDia: number;
  montoTotalSemana: number;
  montoTotalMes: number;
  montoTotalAnio: number;
  idSucursal: number;
}

export class EstacionVentaModel implements EstacionVenta {
  idEstacion: number;
  nombre: string;
  numero: number;
  idAlmacen: number;
  nombreAlmacen: string;
  montoTotalDia: number;
  montoTotalSemana: number;
  montoTotalMes: number;
  montoTotalAnio: number;
  idSucursal: number;

  constructor(data: Partial<EstacionVenta> = {}) {
    this.idEstacion = data.idEstacion ?? 0;
    this.nombre = data.nombre ?? '';
    this.numero = data.numero ?? 0;
    this.idAlmacen = data.idAlmacen ?? 0;
    this.nombreAlmacen = data.nombreAlmacen ?? '';
    this.montoTotalDia = data.montoTotalDia ?? 0;
    this.montoTotalSemana = data.montoTotalSemana ?? 0;
    this.montoTotalMes = data.montoTotalMes ?? 0;
    this.montoTotalAnio = data.montoTotalAnio ?? 0;
    this.idSucursal = data.idSucursal ?? 0;
  }
}
