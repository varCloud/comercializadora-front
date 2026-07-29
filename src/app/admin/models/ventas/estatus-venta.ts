// Estatus de una venta (mapea el enum `EstatusVenta` de comercializadora-api: Activa=1,
// Cancelada=2). Se serializa como número (la API no registra JsonStringEnumConverter), mismo
// patrón que `TipoVentaId` (`admin/models/ventas/tipo-venta.ts`).

export enum EstatusVentaId {
  Activa = 1,
  Cancelada = 2,
}
