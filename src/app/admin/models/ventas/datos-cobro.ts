// Resultado del modal de cobro (CobroDialogComponent) — viaja en `ResultModalModel.data`
// cuando el cajero confirma el cobro. FE-A5 lo consumirá para armar el request de
// `GuardarVenta` contra la API real. Un archivo = una interfaz + su modelo (regla 11).

export interface DatosCobro {
  idCliente: number;
  clienteNombre: string;
  idFormaPago: number;
  formaPagoDescripcion: string;
  facturar: boolean;
  idUsoCFDI: number | null;
  /** Obligatorio solo si el cliente es de tipo "RUTA" (nombre contiene el texto RUTA). */
  numClientesAtendidos: number | null;
  /** Suma de importes del ticket ya con descuento por volumen aplicado, antes de descuento cliente/comisión/IVA. */
  subtotalTicket: number;
  descuentoCliente: number;
  comisionBancaria: number;
  iva: number;
  /** Total final a pagar (subtotal - descuento cliente + comisión bancaria + IVA). */
  total: number;
  efectivoRecibido: number;
  cambio: number;
}

export class DatosCobroModel implements DatosCobro {
  idCliente: number;
  clienteNombre: string;
  idFormaPago: number;
  formaPagoDescripcion: string;
  facturar: boolean;
  idUsoCFDI: number | null;
  numClientesAtendidos: number | null;
  subtotalTicket: number;
  descuentoCliente: number;
  comisionBancaria: number;
  iva: number;
  total: number;
  efectivoRecibido: number;
  cambio: number;

  constructor(data: Partial<DatosCobro> = {}) {
    this.idCliente = data.idCliente ?? 0;
    this.clienteNombre = data.clienteNombre ?? '';
    this.idFormaPago = data.idFormaPago ?? 0;
    this.formaPagoDescripcion = data.formaPagoDescripcion ?? '';
    this.facturar = data.facturar ?? false;
    this.idUsoCFDI = data.idUsoCFDI ?? null;
    this.numClientesAtendidos = data.numClientesAtendidos ?? null;
    this.subtotalTicket = data.subtotalTicket ?? 0;
    this.descuentoCliente = data.descuentoCliente ?? 0;
    this.comisionBancaria = data.comisionBancaria ?? 0;
    this.iva = data.iva ?? 0;
    this.total = data.total ?? 0;
    this.efectivoRecibido = data.efectivoRecibido ?? 0;
    this.cambio = data.cambio ?? 0;
  }
}
