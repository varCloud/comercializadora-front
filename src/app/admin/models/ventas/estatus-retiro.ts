// Estatus de un retiro de efectivo (catálogo Status del legado, embebido en `Retiro.estatusRetiro`).
// Un archivo = una interfaz + su modelo (regla 11).

/** Ids de estatus (paridad con `_ObtenerRetirosAutorizacion.cshtml`): 1 Pendiente · 2 Autorizado · 3 Cancelado. */
export const ESTATUS_RETIRO = {
  PENDIENTE: 1,
  AUTORIZADO: 2,
  CANCELADO: 3,
} as const;

export interface EstatusRetiro {
  idStatus: number;
  descripcion: string;
}

export class EstatusRetiroModel implements EstatusRetiro {
  idStatus: number;
  descripcion: string;

  constructor(data: Partial<EstatusRetiro> = {}) {
    this.idStatus = data.idStatus ?? 0;
    this.descripcion = data.descripcion ?? '';
  }
}
