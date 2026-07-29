// Payload para realizar el cierre de caja (`POST /api/caja/cierre`). Mapea 1:1
// `CajaCierreRequest` de `comercializadora-api` (`Models/Dtos/CajaCierreRequest.cs`). Un
// archivo = una interfaz + su modelo (regla 11).
//
// FE-B5 (integración real), 2 desajustes corregidos contra el contrato real:
// - El campo es `contrasena` (no `password` como traía el boceto FE-B3/mock) — `SP_VALIDA_USUARIO`
//   valida usuario/contraseña en texto plano, y el DTO real del backend usa `Contrasena`.
// - `monto` es un campo real del DTO (comparte `SP_RETIRA_EFECTIVO` con el retiro, @caso=2) pero
//   el legado (`EvtVentas.js`, `HacerCierre()`) siempre lo manda en `0` para el cierre — solo
//   `efectivoEntregadoEnCierre` importa aquí; se conserva ese mismo `0` fijo.

export interface CierreRequest {
  monto: number;
  efectivoEntregadoEnCierre: number;
  usuarioAutoriza: string | null;
  contrasena: string | null;
}

export class CierreRequestModel implements CierreRequest {
  monto: number;
  efectivoEntregadoEnCierre: number;
  usuarioAutoriza: string | null;
  contrasena: string | null;

  constructor(data: Partial<CierreRequest> = {}) {
    this.monto = data.monto ?? 0;
    this.efectivoEntregadoEnCierre = data.efectivoEntregadoEnCierre ?? 0;
    this.usuarioAutoriza = data.usuarioAutoriza ?? null;
    this.contrasena = data.contrasena ?? null;
  }
}
