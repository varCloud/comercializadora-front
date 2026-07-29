// Resultado de validar si el usuario/estación en sesión ya tiene una caja abierta (pantalla de
// entrada al POS, HU "Apertura y cierre de caja"). Un archivo = una interfaz + su modelo
// (regla 11).
//
// FE-B5 (integración real): `GET /api/caja/valida-apertura` devuelve `Notificacion<int>` puro
// (SP_VALIDA_APERTURA_CAJAS vía `ICajaRepository.ValidaAperturaAsync`), NO el objeto rico que
// asumía el boceto inicial (FE-B1/FE-B2, mock). `EsExitoso` (estatus 200) = la estación ya tiene
// caja abierta hoy; `Modelo`/`idCierre` no se expone y `requiereAutorizacionCierre` tampoco —
// esa bandera (`SP_CONSULTA_CONFIGURACION_VENTAS`) es interna a `CajaController.Cierre` y no
// tiene endpoint propio (ver `CajaService.cerrarCaja`/`CierreCajaComponent` para cómo se resuelve
// sin ella).

export interface ValidaApertura {
  /** True si la estación ya tiene una caja abierta hoy (no debe volver a abrir). */
  tieneCajaAbierta: boolean;
  mensaje: string | null;
}

export class ValidaAperturaModel implements ValidaApertura {
  tieneCajaAbierta: boolean;
  mensaje: string | null;

  constructor(data: Partial<ValidaApertura> = {}) {
    this.tieneCajaAbierta = data.tieneCajaAbierta ?? false;
    this.mensaje = data.mensaje ?? null;
  }
}
