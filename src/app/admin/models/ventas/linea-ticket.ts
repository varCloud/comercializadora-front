// Línea del ticket de venta (carrito local del POS). Un archivo = una interfaz + su modelo
// (regla 11). Se recalcula en vivo (precioUnitario) cada vez que cambia el ticket completo —
// ver `PosComponent.recalcularTicket()`, réplica de `actualizaTicketVenta()` del legado.

export interface LineaTicket {
  idProducto: number;
  descripcion: string;
  codigoBarras: string;
  cantidad: number;
  /** Precio base sin descuento por volumen (= producto.precioIndividual). */
  precioBase: number;
  /** Precio realmente aplicado a la línea tras evaluar el descuento por volumen. */
  precioUnitario: number;
  /** Existencia disponible del producto (para no permitir cantidad > existencia). */
  existenciaDisponible: number;
  fraccion: boolean;
}

export class LineaTicketModel implements LineaTicket {
  idProducto: number;
  descripcion: string;
  codigoBarras: string;
  cantidad: number;
  precioBase: number;
  precioUnitario: number;
  existenciaDisponible: number;
  fraccion: boolean;

  constructor(data: Partial<LineaTicket> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.codigoBarras = data.codigoBarras ?? '';
    this.cantidad = data.cantidad ?? 0;
    this.precioBase = data.precioBase ?? 0;
    this.precioUnitario = data.precioUnitario ?? 0;
    this.existenciaDisponible = data.existenciaDisponible ?? 0;
    this.fraccion = data.fraccion ?? false;
  }
}
