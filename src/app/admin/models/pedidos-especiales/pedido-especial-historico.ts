// Fila del listado "Consultar Pedidos" (búsqueda histórica de pedidos especiales, Bloque D).
// Mapea `PedidoEspecialHistorico` de comercializadora-api (`GET /pedidos-especiales/buscar`),
// réplica de `SP_OBTENER_PEDIDOS_ESPECIALES` / `BuscarPedidosEspeciales` del legado
// (`EvtConsultaPedidosEspecialesV2.js::onSuccessPedidosEspeciales`). Un archivo = una interfaz +
// su modelo (regla 09/11). Se omiten campos del contrato real no usados por esta pantalla
// (`idEstacion`, `idFactMetodoPago`, `idFactFormaPago`, `idUsuarioEntrega`, `numeroUnidadTaxi`
// — pertenecen al flujo de facturación/entrega, fuera de alcance de "Consultar Pedidos"), mismo
// criterio ya usado en `ProductoConfirmar`.
//
// **`fechaAlta` es `string`, no `Date`**: el SP la arma con `CONVERT(...) + ' ' + CONVERT(...)`
// (texto ya formateado "dd/MM/yyyy hh:mm:ssAM/PM"), verificado contra el DTO real de la API — se
// muestra tal cual, sin parsear.
//
// `puedeDevolver`/`existeTicket`/`puedeFacturar` gobiernan qué acciones del menú "Acciones" se
// muestran por fila (réplica exacta de los `if` del dropdown legado).
export interface PedidoEspecialHistorico {
  idPedidoEspecial: number;
  idCliente: number;
  cantidad: number;
  fechaAlta: string;
  montoTotal: number;
  idUsuario: number;
  idEstatusPedidoEspecial: number;
  observaciones: string;
  codigoBarras: string;
  nombreCliente: string | null;
  nombreUsuario: string | null;
  estatusPedidoEspecial: string | null;
  /** "SI" | "NO" — el SP arma el texto directo (no es un bit). */
  facturado: string | null;
  liquidado: boolean | null;
  puedeDevolver: boolean;
  existeTicket: boolean;
  puedeFacturar: boolean;
}

export class PedidoEspecialHistoricoModel implements PedidoEspecialHistorico {
  idPedidoEspecial: number;
  idCliente: number;
  cantidad: number;
  fechaAlta: string;
  montoTotal: number;
  idUsuario: number;
  idEstatusPedidoEspecial: number;
  observaciones: string;
  codigoBarras: string;
  nombreCliente: string | null;
  nombreUsuario: string | null;
  estatusPedidoEspecial: string | null;
  facturado: string | null;
  liquidado: boolean | null;
  puedeDevolver: boolean;
  existeTicket: boolean;
  puedeFacturar: boolean;

  constructor(data: Partial<PedidoEspecialHistorico> = {}) {
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
    this.idCliente = data.idCliente ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.fechaAlta = data.fechaAlta ?? '';
    this.montoTotal = data.montoTotal ?? 0;
    this.idUsuario = data.idUsuario ?? 0;
    this.idEstatusPedidoEspecial = data.idEstatusPedidoEspecial ?? 0;
    this.observaciones = data.observaciones ?? '';
    this.codigoBarras = data.codigoBarras ?? '';
    this.nombreCliente = data.nombreCliente ?? null;
    this.nombreUsuario = data.nombreUsuario ?? null;
    this.estatusPedidoEspecial = data.estatusPedidoEspecial ?? null;
    this.facturado = data.facturado ?? null;
    this.liquidado = data.liquidado ?? null;
    this.puedeDevolver = data.puedeDevolver ?? false;
    this.existeTicket = data.existeTicket ?? false;
    this.puedeFacturar = data.puedeFacturar ?? false;
  }
}
