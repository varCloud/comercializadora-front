// Un producto de un Pedido Especial disponible para agregar al ticket del POS. Mapea 1:1 la
// entidad `PedidoEspecialProducto` de comercializadora-api — `GET /pedidos-especiales/{folio}/
// productos`. `habilitado`/`motivoInhabilitado`/`existenciaMenorASolicitada` ya vienen
// calculados desde la API: el front NO los re-evalúa. Alimenta el diálogo "Buscar Pedido
// Especial" del POS (feature Ventas, Bloque E gap-fix). Un archivo = una interfaz + su modelo
// (regla 11). Nombres de campo = contrato JSON (camelCase).

export interface PedidoEspecialProducto {
  idProducto: number;
  descripcion: string;
  /** Cantidad aceptada del pedido especial. */
  cantidadRecibida: number;
  /** Existencia disponible actual del producto en el almacén del usuario. */
  cantidad: number;
  precioIndividual: number;
  precioMenudeo: number;
  /** Ya calculado por la API: sin precio individual/menudeo o sin existencia → false. */
  habilitado: boolean;
  /** Motivo por el que está inhabilitado (null si `habilitado = true`). */
  motivoInhabilitado: string | null;
  /** Advertencia no bloqueante: la cantidad recibida excede la existencia disponible actual. */
  existenciaMenorASolicitada: boolean;
}

export class PedidoEspecialProductoModel implements PedidoEspecialProducto {
  idProducto: number;
  descripcion: string;
  cantidadRecibida: number;
  cantidad: number;
  precioIndividual: number;
  precioMenudeo: number;
  habilitado: boolean;
  motivoInhabilitado: string | null;
  existenciaMenorASolicitada: boolean;

  constructor(data: Partial<PedidoEspecialProducto> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.cantidadRecibida = data.cantidadRecibida ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.precioIndividual = data.precioIndividual ?? 0;
    this.precioMenudeo = data.precioMenudeo ?? 0;
    this.habilitado = data.habilitado ?? false;
    this.motivoInhabilitado = data.motivoInhabilitado ?? null;
    this.existenciaMenorASolicitada = data.existenciaMenorASolicitada ?? false;
  }
}
