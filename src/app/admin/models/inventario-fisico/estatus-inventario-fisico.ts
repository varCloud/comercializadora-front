// Estatus del inventario físico tal como lo devuelve la API (objeto anidado del listado).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON de la API.

/** Ids de estatus (tabla Status del legado): 1 Pendiente · 2 Iniciado · 3 Finalizado/Afectado · 4 Cancelado. */
export const ESTATUS_INVENTARIO_FISICO = {
  PENDIENTE: 1,
  INICIADO: 2,
  FINALIZADO: 3,
  CANCELADO: 4,
} as const;

export interface EstatusInventarioFisico {
  idStatus: number;
  descripcion: string | null;
}

export class EstatusInventarioFisicoModel implements EstatusInventarioFisico {
  idStatus: number;
  descripcion: string | null;

  constructor(data: Partial<EstatusInventarioFisico> = {}) {
    this.idStatus = data.idStatus ?? 0;
    this.descripcion = data.descripcion ?? null;
  }
}
