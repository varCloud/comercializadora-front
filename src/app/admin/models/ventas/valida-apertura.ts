// Resultado de validar si el usuario/estación en sesión ya tiene una caja abierta (pantalla de
// entrada al POS, HU "Apertura y cierre de caja"). Un archivo = una interfaz + su modelo
// (regla 11).
//
// NOTA (sin API real todavía): mapea `GET /api/caja/valida-apertura` según el contrato
// documentado en `task_ventas.md` (Bloque B); FE-B5 debe verificarla contra la respuesta real.

export interface ValidaApertura {
  /** True si la estación ya tiene una caja abierta hoy (no debe volver a abrir). */
  tieneCajaAbierta: boolean;
  idCierre: number | null;
  /** True si la configuración del sistema exige usuario/contraseña para cerrar (SP_CONSULTA_CONFIGURACION_VENTAS). */
  requiereAutorizacionCierre: boolean;
  mensaje: string | null;
}

export class ValidaAperturaModel implements ValidaApertura {
  tieneCajaAbierta: boolean;
  idCierre: number | null;
  requiereAutorizacionCierre: boolean;
  mensaje: string | null;

  constructor(data: Partial<ValidaApertura> = {}) {
    this.tieneCajaAbierta = data.tieneCajaAbierta ?? false;
    this.idCierre = data.idCierre ?? null;
    this.requiereAutorizacionCierre = data.requiereAutorizacionCierre ?? false;
    this.mensaje = data.mensaje ?? null;
  }
}
