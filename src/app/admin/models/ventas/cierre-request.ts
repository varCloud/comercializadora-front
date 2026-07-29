// Payload para realizar el cierre de caja (`POST /api/caja/cierre`), réplica de `HacerCierre()` +
// `ModalAutorizarCierre()`/`ValidarContrasena` de `EvtVentas.js`, adaptada al contrato nuevo
// documentado en `task_ventas.md` (Bloque B): el cierre y la autorización viajan en la MISMA
// petición (`usuarioAutoriza`/`password`), a diferencia del legado (dos pasos: valida
// contraseña y luego cierra). Un archivo = una interfaz + su modelo (regla 11).
//
// NOTA (FE-B3, sin API real todavía): `usuarioAutoriza`/`password` solo se envían cuando la
// configuración exige autorización (`ValidaApertura.requiereAutorizacionCierre`). FE-B5 debe
// verificar los nombres de campo contra el contrato real de `API-B4`.

export interface CierreRequest {
  efectivoEntregadoEnCierre: number;
  usuarioAutoriza: string | null;
  password: string | null;
}

export class CierreRequestModel implements CierreRequest {
  efectivoEntregadoEnCierre: number;
  usuarioAutoriza: string | null;
  password: string | null;

  constructor(data: Partial<CierreRequest> = {}) {
    this.efectivoEntregadoEnCierre = data.efectivoEntregadoEnCierre ?? 0;
    this.usuarioAutoriza = data.usuarioAutoriza ?? null;
    this.password = data.password ?? null;
  }
}
