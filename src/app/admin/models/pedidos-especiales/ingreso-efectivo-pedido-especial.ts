// Registro de un ingreso de efectivo/apertura de caja de Pedidos Especiales — alimenta el
// listado opcional `GET .../caja/ingresos-efectivo` del contrato documentado (por si el resumen
// de cierre llegara a necesitarlo; hoy ninguna pantalla de `cierre_caja_pe` lo consume todavía).
// Entidad propia del módulo — NO reusar nada de Ventas (HU `cierre_caja_pe`: mismos nombres en
// el legado C#, SP y columnas distintas). Un archivo = una interfaz + su modelo (regla 11).
//
// NOTA (FE-1, sin API-2 verificada todavía): campos mínimos según el contrato + el mismo patrón
// de `RetiroEfectivoPedidoEspecial` (este módulo) / `Retiro` (Ventas, ya migrado). Ajustar cuando
// API-2 verifique las columnas reales de `SP_CONSULTA_INGRESOS_EFECTIVO_PEDIDOS_ESPECIALES`
// contra BD dev — no se inventan campos adicionales por ahora.

import { TipoIngresoPedidoEspecialId } from './tipo-ingreso-pedido-especial';

export interface IngresoEfectivoPedidoEspecial {
  idIngreso: number;
  monto: number;
  idTipoIngreso: TipoIngresoPedidoEspecialId;
  idUsuario: number;
  nombreUsuario: string;
  idEstacion: number;
  nombreEstacion: string;
  fechaAlta: string;
}

export class IngresoEfectivoPedidoEspecialModel implements IngresoEfectivoPedidoEspecial {
  idIngreso: number;
  monto: number;
  idTipoIngreso: TipoIngresoPedidoEspecialId;
  idUsuario: number;
  nombreUsuario: string;
  idEstacion: number;
  nombreEstacion: string;
  fechaAlta: string;

  constructor(data: Partial<IngresoEfectivoPedidoEspecial> = {}) {
    this.idIngreso = data.idIngreso ?? 0;
    this.monto = data.monto ?? 0;
    this.idTipoIngreso = data.idTipoIngreso ?? TipoIngresoPedidoEspecialId.IngresoEfectivo;
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreUsuario = data.nombreUsuario ?? '';
    this.idEstacion = data.idEstacion ?? 0;
    this.nombreEstacion = data.nombreEstacion ?? '';
    this.fechaAlta = data.fechaAlta ?? '';
  }
}
