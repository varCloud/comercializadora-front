// Payload para aprobar/rechazar un retiro (`PATCH /api/caja/retiros/{id}/estatus`). Mapea 1:1
// `ActualizarEstatusRetiroRequest` de `comercializadora-api`
// (`Models/Dtos/ActualizarEstatusRetiroRequest.cs`). Un archivo = una interfaz + su modelo
// (regla 11).
//
// FE-B5 (integración real), 3 desajustes corregidos contra el contrato real (el boceto FE-B4/mock
// usaba `idEstatus`/`montoAutorizado` opcional, sin `idTipoRetiro`):
// - El campo es `idStatus` (no `idEstatus`).
// - El campo es `monto` (no `montoAutorizado`) y es **obligatorio** (`float`, no nullable): al
//   rechazar se manda `0` (réplica de `ActualizarEstatusRetiro()` en `EvtRetiros.js` del legado,
//   que también manda `0` al cancelar).
// - `idTipoRetiro` es obligatorio: el SP (`SP_ACTUALIZA_STATUS_RETIROS`) actualiza una tabla
//   distinta según sea retiro por exceso de efectivo o cierre de día; el `id` de la ruta no basta.

export interface ActualizarEstatusRetiroRequest {
  /** `ESTATUS_RETIRO.AUTORIZADO` (2) o `ESTATUS_RETIRO.CANCELADO` (3). */
  idStatus: number;
  /** Monto autorizado (editable respecto al solicitado); `0` al rechazar. */
  monto: number;
  /** `TipoRetiroId.ExcesoEfectivo` (1) o `TipoRetiroId.CierreDia` (2) del retiro que se actualiza. */
  idTipoRetiro: number;
}

export class ActualizarEstatusRetiroRequestModel implements ActualizarEstatusRetiroRequest {
  idStatus: number;
  monto: number;
  idTipoRetiro: number;

  constructor(data: Partial<ActualizarEstatusRetiroRequest> = {}) {
    this.idStatus = data.idStatus ?? 0;
    this.monto = data.monto ?? 0;
    this.idTipoRetiro = data.idTipoRetiro ?? 0;
  }
}
