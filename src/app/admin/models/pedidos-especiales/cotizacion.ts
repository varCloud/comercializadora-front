// Cotización de pedido especial (fila del listado "Cotizaciones", Bloque C).
// Mapea 1:1 las columnas de `Cotizaciones.cshtml` (legado): No. Cotización, Fecha, Cliente,
// Cantidad, Monto Total. `idCliente`/`idEstatusPedidoEspecial` viajan también porque el legado
// los pasa como querystring al link "Editar cotización" (`Url.Action("PedidosEspeciales", ...,
// new { idPedidoEspecial, idCliente, idEstatusPedidoEspecial })`) — la HU de este bloque deja
// esta pantalla como solo lectura sin flujo de edición propio, así que esos campos NO se usan
// todavía en la UI (quedan tipados por si un incremento futuro habilita "Editar").
//
// Endpoint real: `GET /pedidos-especiales/cotizaciones` (Bloque C, API ya migrada y revisada 🟢).
// Un archivo = una interfaz + su modelo (regla 09/11).

export interface Cotizacion {
  idPedidoEspecial: number;
  idCliente: number;
  idEstatusPedidoEspecial: number;
  fechaAlta: string | null;
  nombreCliente: string | null;
  cantidad: number;
  montoTotal: number;
}

export class CotizacionModel implements Cotizacion {
  idPedidoEspecial: number;
  idCliente: number;
  idEstatusPedidoEspecial: number;
  fechaAlta: string | null;
  nombreCliente: string | null;
  cantidad: number;
  montoTotal: number;

  constructor(data: Partial<Cotizacion> = {}) {
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
    this.idCliente = data.idCliente ?? 0;
    this.idEstatusPedidoEspecial = data.idEstatusPedidoEspecial ?? 0;
    this.fechaAlta = data.fechaAlta ?? null;
    this.nombreCliente = data.nombreCliente ?? null;
    this.cantidad = data.cantidad ?? 0;
    this.montoTotal = data.montoTotal ?? 0;
  }
}
