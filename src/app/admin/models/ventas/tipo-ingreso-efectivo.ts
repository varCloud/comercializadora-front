// Tipo de ingreso de efectivo (mapea `EnumTipoIngresoEfectivo` del legado,
// `Models/Enumeraciones.cs`). Se serializa como número.

export enum TipoIngresoEfectivoId {
  /** Apertura de caja (`AperturaCajas.cshtml` invoca `_IngresoEfectivo` con este tipo). */
  AperturaCajas = 1,
  /** Ingreso de efectivo "libre" durante el turno (solicitud de efectivo). */
  SolicitudEfectivo = 2,
}
