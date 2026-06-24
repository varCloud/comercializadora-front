// Estatus de compra (catálogo CatStatusCompra) como lo devuelve la API.
// 1 Pendiente · 2 Realizada · 3 Finalizada · 4 Cancelada · 5 Devolución.
// Un archivo = una interfaz + su modelo (regla 11).

export interface EstatusCompra {
  idStatus: number;
  descripcion: string;
}

export class EstatusCompraModel implements EstatusCompra {
  idStatus: number;
  descripcion: string;

  constructor(data: Partial<EstatusCompra> = {}) {
    this.idStatus = data.idStatus ?? 0;
    this.descripcion = data.descripcion ?? '';
  }
}
