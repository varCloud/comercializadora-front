// Forma de pago del modal de cobro. Un archivo = una interfaz + su modelo (regla 11).
//
// NOTA (FE-A5 / API-A5): catálogo hoy simulado localmente (`pos-catalogo-mock.service.ts`).
// La API real (`SP_CONSULTA_FORMA_PAGO`) puede traer ids distintos a los usados aquí —
// se conservan 1=Efectivo/4=Crédito/18=Débito por paridad con los ids mágicos del legado
// (EvtVentas.js:1516-1517), a validar/reemplazar cuando exista el catálogo real.

export interface FormaPago {
  id: number;
  descripcion: string;
  /** Si es efectivo se habilita la captura de "Efectivo recibido" con cambio en tiempo real. */
  esEfectivo: boolean;
  /** Tarjeta de crédito/débito: aplica comisión bancaria cuando la venta NO se factura. */
  esTarjeta: boolean;
}

export class FormaPagoModel implements FormaPago {
  id: number;
  descripcion: string;
  esEfectivo: boolean;
  esTarjeta: boolean;

  constructor(data: Partial<FormaPago> = {}) {
    this.id = data.id ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.esEfectivo = data.esEfectivo ?? false;
    this.esTarjeta = data.esTarjeta ?? false;
  }
}
