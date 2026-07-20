// Fila del listado de "Reportes > Cierres de Caja" (paridad de campos con `CierreDto` del
// back-end, que a su vez migra `Cierre.cs` / `SP_ConsultaCierresCaja` del legado). Un archivo =
// una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON de la API (camelCase,
// regla 09) — el legado (`Cierre.cs`) expone `ProductosDevueltos`, `MontoTotalDevoluciones` y
// `EfectivoEntregadoEnCierre` en PascalCase, pero se asume serialización estándar de ASP.NET
// Core (camelCase) para el DTO nuevo, igual que el resto de propiedades; **confirmar con
// API-1..API-3 que el JSON real respeta camelCase en esos 3 campos** antes de wirear FE-5/FE-6.
//
// Orden de columnas 1:1 con `Views/Reportes/Cierres.cshtml` (17 columnas, ver
// cierre-list.component.html).

export interface Cierre {
  idCierre: number;
  fechaCierre: string;
  descAlmacen: string;
  nombreUsuario: string;
  montoApertura: number;
  montoIngresosEfectivo: number;
  totalVentas: number;
  montoVentasContado: number;
  montoVentasTarjeta: number;
  montoVentasTransferencias: number;
  montoVentasOtros: number;
  montoVentasCanceladas: number;
  productosDevueltos: number;
  montoTotalDevoluciones: number;
  retirosExcesoEfectivo: number;
  montoCierre: number;
  efectivoDisponible: number;
  efectivoEntregadoEnCierre: number;
}

export class CierreModel implements Cierre {
  idCierre: number;
  fechaCierre: string;
  descAlmacen: string;
  nombreUsuario: string;
  montoApertura: number;
  montoIngresosEfectivo: number;
  totalVentas: number;
  montoVentasContado: number;
  montoVentasTarjeta: number;
  montoVentasTransferencias: number;
  montoVentasOtros: number;
  montoVentasCanceladas: number;
  productosDevueltos: number;
  montoTotalDevoluciones: number;
  retirosExcesoEfectivo: number;
  montoCierre: number;
  efectivoDisponible: number;
  efectivoEntregadoEnCierre: number;

  constructor(data: Partial<Cierre> = {}) {
    this.idCierre = data.idCierre ?? 0;
    this.fechaCierre = data.fechaCierre ?? '';
    this.descAlmacen = data.descAlmacen ?? '';
    this.nombreUsuario = data.nombreUsuario ?? '';
    this.montoApertura = data.montoApertura ?? 0;
    this.montoIngresosEfectivo = data.montoIngresosEfectivo ?? 0;
    this.totalVentas = data.totalVentas ?? 0;
    this.montoVentasContado = data.montoVentasContado ?? 0;
    this.montoVentasTarjeta = data.montoVentasTarjeta ?? 0;
    this.montoVentasTransferencias = data.montoVentasTransferencias ?? 0;
    this.montoVentasOtros = data.montoVentasOtros ?? 0;
    this.montoVentasCanceladas = data.montoVentasCanceladas ?? 0;
    this.productosDevueltos = data.productosDevueltos ?? 0;
    this.montoTotalDevoluciones = data.montoTotalDevoluciones ?? 0;
    this.retirosExcesoEfectivo = data.retirosExcesoEfectivo ?? 0;
    this.montoCierre = data.montoCierre ?? 0;
    this.efectivoDisponible = data.efectivoDisponible ?? 0;
    this.efectivoEntregadoEnCierre = data.efectivoEntregadoEnCierre ?? 0;
  }
}
