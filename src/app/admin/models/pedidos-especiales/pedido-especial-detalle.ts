// Línea de detalle de un pedido especial para "Consultar Pedidos" (Bloque D — `GET
// /pedidos-especiales/{folio}/detalle`, mapea `PedidoEspecialDetalleProducto` de
// comercializadora-api, mismo SP que "Confirmar Productos"/Bloque B). Réplica de
// `PedidosEspecialesV2Controller.ObtenerPedidosEspecialesDetalle` del legado: **una sola fuente
// se usa tanto para la tabla "Ver Detalle" (`MostrarDetalle`) como para armar el formulario de
// "Registrar Devolución" (`MostrarDetalleDevolucion`)** — por eso este modelo trae los campos de
// ambas pantallas (incluye `fraccion`/`montoComisionBancaria`, que `ProductoConfirmar` de
// Bloque B no necesitaba). Un archivo = una interfaz + su modelo (regla 09/11).
//
// **`fraccion`** determina si "Devolver artículos" acepta decimales (`esDecimal`, legado) o solo
// enteros (`esNumero`) — réplica exacta de `MostrarDetalleDevolucion` en
// `EvtConsultaPedidosEspecialesV2.js`.
export interface PedidoEspecialDetalle {
  idPedidoEspecialDetalle: number;
  idPedidoEspecial: number;
  idProducto: number;
  descripcion: string;
  almacen: string;
  /** Cantidad original solicitada/comprada de la línea (base de la devolución). */
  cantidad: number;
  cantidadAtendida: number;
  cantidadRechazada: number;
  cantidadAceptada: number;
  monto: number;
  precioVenta: number;
  idEstatusPedidoEspecialDetalle: number | null;
  estatusPedidoEspecialDetalle: string | null;
  /** No nulo/vacío cuando el producto se vende fraccionado (habilita decimales en la devolución). */
  fraccion: string | null;
  /** Comisión bancaria de la línea completa; se prorratea por cantidad devuelta al calcular el monto a devolver. */
  montoComisionBancaria: number | null;
}

export class PedidoEspecialDetalleModel implements PedidoEspecialDetalle {
  idPedidoEspecialDetalle: number;
  idPedidoEspecial: number;
  idProducto: number;
  descripcion: string;
  almacen: string;
  cantidad: number;
  cantidadAtendida: number;
  cantidadRechazada: number;
  cantidadAceptada: number;
  monto: number;
  precioVenta: number;
  idEstatusPedidoEspecialDetalle: number | null;
  estatusPedidoEspecialDetalle: string | null;
  fraccion: string | null;
  montoComisionBancaria: number | null;

  constructor(data: Partial<PedidoEspecialDetalle> = {}) {
    this.idPedidoEspecialDetalle = data.idPedidoEspecialDetalle ?? 0;
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
    this.idProducto = data.idProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.almacen = data.almacen ?? '';
    this.cantidad = data.cantidad ?? 0;
    this.cantidadAtendida = data.cantidadAtendida ?? 0;
    this.cantidadRechazada = data.cantidadRechazada ?? 0;
    this.cantidadAceptada = data.cantidadAceptada ?? 0;
    this.monto = data.monto ?? 0;
    this.precioVenta = data.precioVenta ?? 0;
    this.idEstatusPedidoEspecialDetalle = data.idEstatusPedidoEspecialDetalle ?? null;
    this.estatusPedidoEspecialDetalle = data.estatusPedidoEspecialDetalle ?? null;
    this.fraccion = data.fraccion ?? null;
    this.montoComisionBancaria = data.montoComisionBancaria ?? null;
  }
}
