// Una ubicación de almacén a imprimir como etiqueta QR (interface + modelo, reglas 09/11).
// Replica el contrato del DTO UbicacionImprimir de la API (camelCase del JSON).

export interface UbicacionImprimir {
  idAlmacen: number;
  descripcionAlmacen: string;
  idPiso: number;
  descripcionPiso: string;
  idPasillo: number;
  descripcionPasillo: string;
  idRaq: number;
  descripcionRaq: string;
}

export class UbicacionImprimirModel implements UbicacionImprimir {
  idAlmacen: number;
  descripcionAlmacen: string;
  idPiso: number;
  descripcionPiso: string;
  idPasillo: number;
  descripcionPasillo: string;
  idRaq: number;
  descripcionRaq: string;

  constructor(data: Partial<UbicacionImprimir> = {}) {
    this.idAlmacen = data.idAlmacen ?? 0;
    this.descripcionAlmacen = data.descripcionAlmacen ?? '';
    this.idPiso = data.idPiso ?? 0;
    this.descripcionPiso = data.descripcionPiso ?? '';
    this.idPasillo = data.idPasillo ?? 0;
    this.descripcionPasillo = data.descripcionPasillo ?? '';
    this.idRaq = data.idRaq ?? 0;
    this.descripcionRaq = data.descripcionRaq ?? '';
  }
}
