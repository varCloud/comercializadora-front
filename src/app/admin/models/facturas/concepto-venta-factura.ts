// Concepto (renglón) de la venta, parte del detalle usado en el diálogo de reenvío.
// Un archivo = una interfaz + su modelo (regla 11).

export interface ConceptoVentaFactura {
  claveProdserv: string | null;
  claveUnidad: string | null;
  cantidad: number;
  unidad: string | null;
  noIdentificacion: string | null;
  descripcion: string | null;
  valorUnitario: number;
  importe: number;
}

export class ConceptoVentaFacturaModel implements ConceptoVentaFactura {
  claveProdserv: string | null;
  claveUnidad: string | null;
  cantidad: number;
  unidad: string | null;
  noIdentificacion: string | null;
  descripcion: string | null;
  valorUnitario: number;
  importe: number;

  constructor(data: Partial<ConceptoVentaFactura> = {}) {
    this.claveProdserv = data.claveProdserv ?? null;
    this.claveUnidad = data.claveUnidad ?? null;
    this.cantidad = data.cantidad ?? 0;
    this.unidad = data.unidad ?? null;
    this.noIdentificacion = data.noIdentificacion ?? null;
    this.descripcion = data.descripcion ?? null;
    this.valorUnitario = data.valorUnitario ?? 0;
    this.importe = data.importe ?? 0;
  }
}
