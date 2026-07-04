// Tipo de cliente (catálogo CatTipoCliente): clasifica al cliente y define su % de descuento.
// Era la pantalla "Descuentos" del legado. Lo devuelven api/tipos-cliente y el catálogo
// api/clientes/catalogos/tipos. Un archivo = una interfaz + su modelo (regla 11).

export interface TipoCliente {
  idTipoCliente: number;
  descripcion: string;
  /** % de descuento (0–100). */
  descuento: number;
  activo: boolean;
}

export class TipoClienteModel implements TipoCliente {
  idTipoCliente: number;
  descripcion: string;
  descuento: number;
  activo: boolean;

  constructor(data: Partial<TipoCliente> = {}) {
    this.idTipoCliente = data.idTipoCliente ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.descuento = data.descuento ?? 0;
    this.activo = data.activo ?? true;
  }
}
