// Sucursal del inventario físico tal como la devuelve la API (objeto anidado del listado).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON de la API.

export interface SucursalInventarioFisico {
  idSucursal: number;
  descripcion: string | null;
}

export class SucursalInventarioFisicoModel implements SucursalInventarioFisico {
  idSucursal: number;
  descripcion: string | null;

  constructor(data: Partial<SucursalInventarioFisico> = {}) {
    this.idSucursal = data.idSucursal ?? 0;
    this.descripcion = data.descripcion ?? null;
  }
}
