// Payload de POST /api/facturas/estatus-cancelacion. Un archivo = una interfaz + su modelo
// (regla 11). `esPedidoEspecial` se deja reutilizable (hoy solo se soporta `false`, ver
// memoria del bloque API); esta pantalla siempre lo manda en false.

export interface EstatusCancelacionRequest {
  id: number;
  esPedidoEspecial: boolean;
}

export class EstatusCancelacionRequestModel implements EstatusCancelacionRequest {
  id: number;
  esPedidoEspecial: boolean;

  constructor(data: Partial<EstatusCancelacionRequest> = {}) {
    this.id = data.id ?? 0;
    this.esPedidoEspecial = data.esPedidoEspecial ?? false;
  }
}
