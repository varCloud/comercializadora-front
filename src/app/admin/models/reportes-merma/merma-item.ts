// Fila del listado (paginado) de "Reportes > Merma" (paridad de campos con `MermaItem.cs` del
// back-end, que a su vez mapea el resultset de `SP_CONSULTA_MERMA`). Un archivo = una interfaz +
// su modelo (regla 11). Nombres de campo = contrato JSON de la API (camelCase).

export interface MermaItem {
  idReporteMerma: number;
  idProducto: number;
  inventarioFinalMesAnt: number;
  totalCompras: number;
  inventarioSistema: number;
  merma: number;
  porcMerma: number;
  ultCostoCompra: number;
  costoMerma: number;
  ultimoDiaMesCalculo: string;
  ultimoDiaMesAnterior: string;
  fechaAlta: string;
  codigoBarras: string;
  descripcionProducto: string;
  idLineaProducto: number;
  descripcionLinea: string;
}

export class MermaItemModel implements MermaItem {
  idReporteMerma: number;
  idProducto: number;
  inventarioFinalMesAnt: number;
  totalCompras: number;
  inventarioSistema: number;
  merma: number;
  porcMerma: number;
  ultCostoCompra: number;
  costoMerma: number;
  ultimoDiaMesCalculo: string;
  ultimoDiaMesAnterior: string;
  fechaAlta: string;
  codigoBarras: string;
  descripcionProducto: string;
  idLineaProducto: number;
  descripcionLinea: string;

  constructor(data: Partial<MermaItem> = {}) {
    this.idReporteMerma = data.idReporteMerma ?? 0;
    this.idProducto = data.idProducto ?? 0;
    this.inventarioFinalMesAnt = data.inventarioFinalMesAnt ?? 0;
    this.totalCompras = data.totalCompras ?? 0;
    this.inventarioSistema = data.inventarioSistema ?? 0;
    this.merma = data.merma ?? 0;
    this.porcMerma = data.porcMerma ?? 0;
    this.ultCostoCompra = data.ultCostoCompra ?? 0;
    this.costoMerma = data.costoMerma ?? 0;
    this.ultimoDiaMesCalculo = data.ultimoDiaMesCalculo ?? '';
    this.ultimoDiaMesAnterior = data.ultimoDiaMesAnterior ?? '';
    this.fechaAlta = data.fechaAlta ?? '';
    this.codigoBarras = data.codigoBarras ?? '';
    this.descripcionProducto = data.descripcionProducto ?? '';
    this.idLineaProducto = data.idLineaProducto ?? 0;
    this.descripcionLinea = data.descripcionLinea ?? '';
  }
}
