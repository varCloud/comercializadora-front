// Tipo de retiro de efectivo (mapea `EnumTipoRetiro` del legado, `Models/Enumeraciones.cs`).
// Se serializa como número (misma convención que `TipoVentaId`).

export enum TipoRetiroId {
  ExcesoEfectivo = 1,
  CierreDia = 2,
}
