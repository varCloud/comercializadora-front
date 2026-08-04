// Pedido especial "en ruta" (fila del listado "Pedidos en Ruta", Bloque C).
// Mapea 1:1 las columnas de `_ObtenerPedidosEnRuta.cshtml` (legado):
// #/idPedidoEspecial, Cliente, Monto, # Productos, Usuario, Fecha Alta.
// `idCliente` viaja también porque el legado lo pasa como querystring al entrar a
// "ConfirmarProductos" desde la acción "Liquidar Pedido" del dropdown de acciones
// (`Url.Action("ConfirmarProductos", ..., new { idPedidoEspecial, esPedidoEnRuta = true, idCliente })`).
//
// Endpoint real: `GET /pedidos-especiales/en-ruta` (Bloque C, API ya migrada y revisada 🟢).
// Un archivo = una interfaz + su modelo (regla 09/11).

export interface PedidoEnRuta {
  idPedidoEspecial: number;
  idCliente: number;
  nombreCliente: string | null;
  montoTotal: number;
  /** Cantidad de productos del pedido ("# Productos" en el listado legado). */
  cantidad: number;
  idUsuario: number;
  nombreUsuario: string | null;
  fechaAlta: string | null;
}

export class PedidoEnRutaModel implements PedidoEnRuta {
  idPedidoEspecial: number;
  idCliente: number;
  nombreCliente: string | null;
  montoTotal: number;
  cantidad: number;
  idUsuario: number;
  nombreUsuario: string | null;
  fechaAlta: string | null;

  constructor(data: Partial<PedidoEnRuta> = {}) {
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
    this.idCliente = data.idCliente ?? 0;
    this.nombreCliente = data.nombreCliente ?? null;
    this.montoTotal = data.montoTotal ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreUsuario = data.nombreUsuario ?? null;
    this.fechaAlta = data.fechaAlta ?? null;
  }
}
