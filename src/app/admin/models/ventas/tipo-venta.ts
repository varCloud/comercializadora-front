// Tipo de venta/ticket del POS (mapea el enum `TipoVenta` de la API — se serializa como
// número, no como string, porque la API no registra JsonStringEnumConverter). Un catálogo
// fijo, mismo patrón que `models/reportes-devolucion/tipo-ticket.ts` (TipoTicketId).

export enum TipoVentaId {
  Normal = 1,
  Devolucion = 2,
  AgregarProductosVenta = 3,
  ProductosLiquidos = 4,
  ConsultaDevolucion = 5,
}
