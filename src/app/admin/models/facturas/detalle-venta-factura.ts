// Detalle de la venta para el diálogo de reenvío de factura (cliente, forma de pago, uso CFDI,
// totales). Mapea GET /api/facturas/detalle/{idVenta}. Un archivo = una interfaz + su modelo
// (regla 11). OJO: `total` viene SIN IVA (suma de conceptos); el total CON impuestos a mostrar
// en el diálogo es `montoTotal` de la fila del listado (FacturaVenta), no este campo.

import {
  ConceptoVentaFactura,
  ConceptoVentaFacturaModel,
} from 'src/app/admin/models/facturas/concepto-venta-factura';

export interface DetalleVentaFactura {
  nombre: string | null;
  rfc: string | null;
  correo: string | null;
  sociedadMercantil: string | null;
  domicilio: string | null;
  usoCfdi: string | null;
  descripcionUsoCfdi: string | null;
  formaPago: string | null;
  descripcionFormaPago: string | null;
  domicilioFiscalReceptor: string | null;
  regimenFiscalReceptor: string | null;
  descripcionRegimenFiscalReceptor: string | null;
  conceptos: ConceptoVentaFactura[];
  /** Suma de conceptos.importe — SIN IVA (ver nota arriba). */
  total: number;
}

export class DetalleVentaFacturaModel implements DetalleVentaFactura {
  nombre: string | null;
  rfc: string | null;
  correo: string | null;
  sociedadMercantil: string | null;
  domicilio: string | null;
  usoCfdi: string | null;
  descripcionUsoCfdi: string | null;
  formaPago: string | null;
  descripcionFormaPago: string | null;
  domicilioFiscalReceptor: string | null;
  regimenFiscalReceptor: string | null;
  descripcionRegimenFiscalReceptor: string | null;
  conceptos: ConceptoVentaFactura[];
  total: number;

  constructor(data: Partial<DetalleVentaFactura> = {}) {
    this.nombre = data.nombre ?? null;
    this.rfc = data.rfc ?? null;
    this.correo = data.correo ?? null;
    this.sociedadMercantil = data.sociedadMercantil ?? null;
    this.domicilio = data.domicilio ?? null;
    this.usoCfdi = data.usoCfdi ?? null;
    this.descripcionUsoCfdi = data.descripcionUsoCfdi ?? null;
    this.formaPago = data.formaPago ?? null;
    this.descripcionFormaPago = data.descripcionFormaPago ?? null;
    this.domicilioFiscalReceptor = data.domicilioFiscalReceptor ?? null;
    this.regimenFiscalReceptor = data.regimenFiscalReceptor ?? null;
    this.descripcionRegimenFiscalReceptor = data.descripcionRegimenFiscalReceptor ?? null;
    this.conceptos = (data.conceptos ?? []).map((c) => new ConceptoVentaFacturaModel(c));
    this.total = data.total ?? 0;
  }
}
