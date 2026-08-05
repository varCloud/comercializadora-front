// Fila del listado de retiros de exceso de efectivo de Pedidos Especiales
// (`GET /api/pedidos-especiales/caja/retiros-efectivo`, contrato documentado en
// `task_cierre_caja_pe.md`). Réplica de `ObtenerRetirosEfectivo` (legado, región
// `RetiroExcesoEfectivo` de `PedidosEspecialesV2Controller`). Entidad propia — NO reusar `Retiro`
// de Ventas (HU `cierre_caja_pe`: mismo nombre de clase en el legado C#, SP y columnas
// distintas). A diferencia de `Retiro` (Ventas), esta HU NO documenta un flujo de
// autorización/estatus para el retiro de Pedidos Especiales — se omiten esos campos hasta que
// API-2 confirme lo contrario contra BD dev (regla "sin inventar"). Un archivo = una interfaz +
// su modelo (regla 11).

export interface RetiroEfectivoPedidoEspecial {
  idRetiro: number;
  monto: number;
  idUsuario: number;
  nombreUsuario: string;
  idEstacion: number;
  nombreEstacion: string;
  fechaAlta: string;
}

export class RetiroEfectivoPedidoEspecialModel implements RetiroEfectivoPedidoEspecial {
  idRetiro: number;
  monto: number;
  idUsuario: number;
  nombreUsuario: string;
  idEstacion: number;
  nombreEstacion: string;
  fechaAlta: string;

  constructor(data: Partial<RetiroEfectivoPedidoEspecial> = {}) {
    this.idRetiro = data.idRetiro ?? 0;
    this.monto = data.monto ?? 0;
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreUsuario = data.nombreUsuario ?? '';
    this.idEstacion = data.idEstacion ?? 0;
    this.nombreEstacion = data.nombreEstacion ?? '';
    this.fechaAlta = data.fechaAlta ?? '';
  }
}
