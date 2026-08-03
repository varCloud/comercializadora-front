// Pedido especial (encabezado), respuesta de guardar/ajustar-iva. Mapea 1:1 la entidad
// `PedidoEspecial` de comercializadora-api. Un archivo = una interfaz + su modelo (regla 09/11).
// Nombres de campo = contrato JSON de la API (camelCase; `idFactUsoCFDI` conserva las
// mayúsculas de "CFDI" porque `JsonNamingPolicy.CamelCase` solo baja la primera letra del
// nombre de la propiedad C# `IdFactUsoCFDI` — mismo criterio ya usado en `venta.ts`).
//
// `idFactFormaPago`/`idFactUsoCFDI` son nullable: un pedido recién creado (antes de llamar
// `guardarIva`) todavía no los tiene.

export interface PedidoEspecial {
  idPedidoEspecial: number;
  idCliente: number;
  nombreCliente: string | null;
  idUsuario: number;
  nombreUsuario: string | null;
  cantidad: number;
  fechaAlta: string | null;
  montoTotal: number;
  idEstatusPedidoEspecial: number;
  idFactFormaPago: number | null;
  idFactUsoCFDI: number | null;
  codigoBarras: string | null;
}

export class PedidoEspecialModel implements PedidoEspecial {
  idPedidoEspecial: number;
  idCliente: number;
  nombreCliente: string | null;
  idUsuario: number;
  nombreUsuario: string | null;
  cantidad: number;
  fechaAlta: string | null;
  montoTotal: number;
  idEstatusPedidoEspecial: number;
  idFactFormaPago: number | null;
  idFactUsoCFDI: number | null;
  codigoBarras: string | null;

  constructor(data: Partial<PedidoEspecial> = {}) {
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
    this.idCliente = data.idCliente ?? 0;
    this.nombreCliente = data.nombreCliente ?? null;
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreUsuario = data.nombreUsuario ?? null;
    this.cantidad = data.cantidad ?? 0;
    this.fechaAlta = data.fechaAlta ?? null;
    this.montoTotal = data.montoTotal ?? 0;
    this.idEstatusPedidoEspecial = data.idEstatusPedidoEspecial ?? 0;
    this.idFactFormaPago = data.idFactFormaPago ?? null;
    this.idFactUsoCFDI = data.idFactUsoCFDI ?? null;
    this.codigoBarras = data.codigoBarras ?? null;
  }
}
