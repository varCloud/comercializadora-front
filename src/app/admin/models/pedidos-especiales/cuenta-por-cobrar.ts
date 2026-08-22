// Fila del listado "Cuentas por Cobrar" (Pedidos Especiales) — un cliente con adeudo.
// Mapea la respuesta de `GET /pedidos-especiales/cuentas-por-cobrar` (paginado, réplica de
// `SP_OBTENER_CUENTAS_X_COBRAR_PEDIDOS_ESPECIALES` vía el `SP_V2_...` nuevo de API-1).
// Un archivo = una interfaz + su modelo (regla 09/11).
//
// **Nota (deuda heredada, ver HU "Supuestos, dependencias y riesgos"):** el SP legado de origen
// concatena `apellidoPaterno` dos veces en `nombreCliente` en vez de `apellidoPaterno +
// apellidoMaterno`. Se hereda tal cual en el SP_V2 nuevo; no se corrige en el front.
export interface CuentaPorCobrar {
  idCliente: number;
  nombreCliente: string;
  montoTotal: number;
  montoPagado: number;
  montoAdeudado: number;
}

export class CuentaPorCobrarModel implements CuentaPorCobrar {
  idCliente: number;
  nombreCliente: string;
  montoTotal: number;
  montoPagado: number;
  montoAdeudado: number;

  constructor(data: Partial<CuentaPorCobrar> = {}) {
    this.idCliente = data.idCliente ?? 0;
    this.nombreCliente = data.nombreCliente ?? '';
    this.montoTotal = data.montoTotal ?? 0;
    this.montoPagado = data.montoPagado ?? 0;
    this.montoAdeudado = data.montoAdeudado ?? 0;
  }
}
