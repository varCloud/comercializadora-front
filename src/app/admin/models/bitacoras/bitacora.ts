// Renglón del reporte "Bitácoras" (consulta de pedidos internos = traspasos entre almacenes),
// tal como lo devuelve la API (GET /api/bitacoras, resultset de SP_V2_CONSULTA_PEDIDOS_INTERNOS).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON de la API.

export interface Bitacora {
  idPedidoInterno: number;
  fechaAlta: string | null;
  idAlmacenOrigen: number;
  almacenOrigen: string | null;
  idAlmacenDestino: number;
  almacenDestino: string | null;
  idUsuario: number;
  nombreCompleto: string | null;
  idStatus: number;
  descripcionEstatus: string | null;
  idProducto: number;
  descripcionProducto: string | null;
  cantidad: number;
}

export class BitacoraModel implements Bitacora {
  idPedidoInterno: number;
  fechaAlta: string | null;
  idAlmacenOrigen: number;
  almacenOrigen: string | null;
  idAlmacenDestino: number;
  almacenDestino: string | null;
  idUsuario: number;
  nombreCompleto: string | null;
  idStatus: number;
  descripcionEstatus: string | null;
  idProducto: number;
  descripcionProducto: string | null;
  cantidad: number;

  constructor(data: Partial<Bitacora> = {}) {
    this.idPedidoInterno = data.idPedidoInterno ?? 0;
    this.fechaAlta = data.fechaAlta ?? null;
    this.idAlmacenOrigen = data.idAlmacenOrigen ?? 0;
    this.almacenOrigen = data.almacenOrigen ?? null;
    this.idAlmacenDestino = data.idAlmacenDestino ?? 0;
    this.almacenDestino = data.almacenDestino ?? null;
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreCompleto = data.nombreCompleto ?? null;
    this.idStatus = data.idStatus ?? 0;
    this.descripcionEstatus = data.descripcionEstatus ?? null;
    this.idProducto = data.idProducto ?? 0;
    this.descripcionProducto = data.descripcionProducto ?? null;
    this.cantidad = data.cantidad ?? 0;
  }
}
