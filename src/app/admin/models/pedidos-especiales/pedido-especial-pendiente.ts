// Pedido especial pendiente de entrega (fila del listado "Entregar Pedido", Bloque B).
// Mapea 1:1 las columnas de `_ObtenerEntregarPedidos.cshtml` (legado):
// #/idPedidoEspecial, Cliente, Monto, # Productos, Usuario, Fecha Alta + `puedeEntregar`
// (controla si la acción "Entregar" se muestra en la fila). `idCliente` viaja también porque
// el legado lo pasa como querystring al entrar a "Confirmar Productos"
// (`Url.Action("ConfirmarProductos", ..., new { idPedidoEspecial, idCliente })`) para poder
// mostrar los datos del cliente en el modal de entrega sin otra consulta.
//
// Contrato real verificado (FE-B5): `GET /pedidos-especiales/pendientes-entrega` (Bloque B),
// mapea `PedidoEspecialPendienteEntrega` de comercializadora-api. El endpoint NO pagina
// server-side (el SP legado no pagina) — ver `EntregarPedidoComponent` (paginación en cliente,
// regla 10 "último recurso"). `idUsuario` se agregó (no estaba en el boceto original) porque el
// filtro "Usuario" del listado necesita comparar por id, no por `nombreUsuario` (frágil). Un
// archivo = una interfaz + su modelo (regla 09/11).

export interface PedidoEspecialPendiente {
  idPedidoEspecial: number;
  idCliente: number;
  nombreCliente: string | null;
  montoTotal: number;
  /** Cantidad de productos del pedido ("# Productos" en el listado legado). */
  cantidad: number;
  idUsuario: number;
  nombreUsuario: string | null;
  fechaAlta: string | null;
  /** false = el pedido ya no admite la acción "Entregar" (p. ej. cancelado o ya entregado). */
  puedeEntregar: boolean;
}

export class PedidoEspecialPendienteModel implements PedidoEspecialPendiente {
  idPedidoEspecial: number;
  idCliente: number;
  nombreCliente: string | null;
  montoTotal: number;
  cantidad: number;
  idUsuario: number;
  nombreUsuario: string | null;
  fechaAlta: string | null;
  puedeEntregar: boolean;

  constructor(data: Partial<PedidoEspecialPendiente> = {}) {
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
    this.idCliente = data.idCliente ?? 0;
    this.nombreCliente = data.nombreCliente ?? null;
    this.montoTotal = data.montoTotal ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreUsuario = data.nombreUsuario ?? null;
    this.fechaAlta = data.fechaAlta ?? null;
    this.puedeEntregar = data.puedeEntregar ?? false;
  }
}
