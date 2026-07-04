// Payload de alta/edición de un tipo de cliente (POST/PUT api/tipos-cliente).
// Un archivo = una interfaz + su modelo (regla 11).

export interface GuardarTipoClienteRequest {
  /** 0 = alta; > 0 = edición (en PUT lo fija la ruta). */
  idTipoCliente: number;
  /** Descripción del tipo (requerida, máx. 50). */
  descripcion: string;
  /** % de descuento que aplica a los clientes del tipo (0–100). */
  descuento: number;
  activo: boolean;
}

export class GuardarTipoClienteRequestModel implements GuardarTipoClienteRequest {
  idTipoCliente: number;
  descripcion: string;
  descuento: number;
  activo: boolean;

  constructor(data: Partial<GuardarTipoClienteRequest> = {}) {
    this.idTipoCliente = data.idTipoCliente ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.descuento = data.descuento ?? 0;
    this.activo = data.activo ?? true;
  }
}
