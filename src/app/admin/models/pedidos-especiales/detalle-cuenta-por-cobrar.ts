// Fila del detalle de "Cuentas por Cobrar" — un pedido especial con adeudo de un cliente.
// Mapea la respuesta de `GET /pedidos-especiales/cuentas-por-cobrar/{idCliente}/detalle`,
// réplica de `SP_OBTENER_DETALLE_CUENTAS_X_COBRAR_PEDIDOS_ESPECIALES` (no pagina; acotado por
// cliente, listas cortas). Incluye los datos del cliente repetidos por fila (igual que el SP),
// consumidos en el diálogo "Realizar abono" (FE-6) para mostrar el encabezado del cliente sin
// una segunda consulta.
// Un archivo = una interfaz + su modelo (regla 09/11).
//
// **Nombres verificados contra el DTO real (FE-4):** `comercializadora-api/Models/Entities/
// DetalleCuentaPorCobrar.cs`. El agente de FE-1 había inferido `tipoCliente`; el campo real del
// backend es **`tipoClienteCliente`** (camelCase del `TipoClienteCliente` de C#) — corregido
// aquí. `fechaUltimoAbono` también se ajustó a `string` (no `string | null`): el backend nunca
// manda null, siempre "N/A" o la fecha formateada (`string FechaUltimoAbono { get; set; } =
// string.Empty;`, sin `?`). El resto de los campos coincidía tal cual.
export interface DetalleCuentaPorCobrar {
  idPedidoEspecial: number;
  saldoInicial: number;
  saldoActual: number;
  fechaUltimoAbono: string;
  // ------- Datos de cliente (repetidos por fila) -------
  idCliente: number;
  nombreCliente: string;
  telefonoCliente: string;
  correoCliente: string;
  rfcCliente: string;
  tipoClienteCliente: string;
}

export class DetalleCuentaPorCobrarModel implements DetalleCuentaPorCobrar {
  idPedidoEspecial: number;
  saldoInicial: number;
  saldoActual: number;
  fechaUltimoAbono: string;
  idCliente: number;
  nombreCliente: string;
  telefonoCliente: string;
  correoCliente: string;
  rfcCliente: string;
  tipoClienteCliente: string;

  constructor(data: Partial<DetalleCuentaPorCobrar> = {}) {
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
    this.saldoInicial = data.saldoInicial ?? 0;
    this.saldoActual = data.saldoActual ?? 0;
    this.fechaUltimoAbono = data.fechaUltimoAbono ?? '';
    this.idCliente = data.idCliente ?? 0;
    this.nombreCliente = data.nombreCliente ?? '';
    this.telefonoCliente = data.telefonoCliente ?? '';
    this.correoCliente = data.correoCliente ?? '';
    this.rfcCliente = data.rfcCliente ?? '';
    this.tipoClienteCliente = data.tipoClienteCliente ?? '';
  }
}
