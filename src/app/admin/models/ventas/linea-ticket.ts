// Línea del ticket de venta (carrito local del POS). Un archivo = una interfaz + su modelo
// (regla 11). Se recalcula en vivo (precioUnitario) cada vez que cambia el ticket completo —
// ver `PosComponent.recalcularTicket()`, réplica de `actualizaTicketVenta()` del legado.
// `idLineaProducto`/`ultimoCostoCompra` se copian del catálogo (`ProductoVenta`) al agregar la
// línea: los necesita `GuardarVentaRequest.Detalles` (FE-A5, `POST /ventas`).

export interface LineaTicket {
  idProducto: number;
  descripcion: string;
  codigoBarras: string;
  idLineaProducto: number;
  cantidad: number;
  /** Precio base sin descuento por volumen (= producto.precioIndividual). */
  precioBase: number;
  /** Precio realmente aplicado a la línea tras evaluar el descuento por volumen. */
  precioUnitario: number;
  /** Último costo de compra del producto (para costo/ganancia del detalle al guardar). */
  ultimoCostoCompra: number;
  /** Existencia disponible del producto (para no permitir cantidad > existencia). */
  existenciaDisponible: number;
  fraccion: boolean;
}

export class LineaTicketModel implements LineaTicket {
  idProducto: number;
  descripcion: string;
  codigoBarras: string;
  idLineaProducto: number;
  cantidad: number;
  precioBase: number;
  precioUnitario: number;
  ultimoCostoCompra: number;
  existenciaDisponible: number;
  fraccion: boolean;

  constructor(data: Partial<LineaTicket> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.codigoBarras = data.codigoBarras ?? '';
    this.idLineaProducto = data.idLineaProducto ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.precioBase = data.precioBase ?? 0;
    this.precioUnitario = data.precioUnitario ?? 0;
    this.ultimoCostoCompra = data.ultimoCostoCompra ?? 0;
    this.existenciaDisponible = data.existenciaDisponible ?? 0;
    this.fraccion = data.fraccion ?? false;
  }
}
