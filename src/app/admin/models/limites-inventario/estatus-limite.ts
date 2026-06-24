// Estatus del nivel de inventario anidado en una fila de límites (1 dentro / 2 sobre máx /
// 3 bajo mín). Replica el shape que devuelve la API (multi-mapping del legado). Regla 09/11.

export interface EstatusLimite {
  idStatus: number;
  descripcion: string;
}

export class EstatusLimiteModel implements EstatusLimite {
  idStatus: number;
  descripcion: string;

  constructor(data: Partial<EstatusLimite> = {}) {
    this.idStatus = data.idStatus ?? 0;
    this.descripcion = data.descripcion ?? '';
  }
}
