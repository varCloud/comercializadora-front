// Payload de "guardar venta" (POST /ventas). Mapea 1:1 el DTO `GuardarVentaRequest` de
// comercializadora-api. idUsuario/idEstacion NUNCA viajan aquí: el backend los toma del JWT
// (regla de seguridad dura de la feature Ventas). Un archivo = una interfaz + su modelo (regla 11).

import {
  VentaDetalleRequest,
  VentaDetalleRequestModel,
} from 'src/app/admin/models/ventas/venta-detalle-request';
import { TipoVentaId } from 'src/app/admin/models/ventas/tipo-venta';

export interface GuardarVentaRequest {
  detalles: VentaDetalleRequest[];

  idCliente: number;
  formaPago: number;
  usoCfdi: number;

  /** 0 = venta nueva; > 0 = id de la venta original (devolución/complemento). */
  idVenta: number;

  aplicaIva: boolean;
  numClientesAtendidos: number;
  tipoVenta: TipoVentaId;

  /** Obligatorio cuando tipoVenta = Devolucion (fuera de alcance de esta pantalla). */
  motivoDevolucion: string | null;

  idPedidoEspecial: number;
  idVentaComplemento: number;
  montoTotalVenta: number;
  montoPagado: number;
}

export class GuardarVentaRequestModel implements GuardarVentaRequest {
  detalles: VentaDetalleRequest[];
  idCliente: number;
  formaPago: number;
  usoCfdi: number;
  idVenta: number;
  aplicaIva: boolean;
  numClientesAtendidos: number;
  tipoVenta: TipoVentaId;
  motivoDevolucion: string | null;
  idPedidoEspecial: number;
  idVentaComplemento: number;
  montoTotalVenta: number;
  montoPagado: number;

  constructor(data: Partial<GuardarVentaRequest> = {}) {
    this.detalles = (data.detalles ?? []).map((d) => new VentaDetalleRequestModel(d));
    this.idCliente = data.idCliente ?? 0;
    this.formaPago = data.formaPago ?? 0;
    this.usoCfdi = data.usoCfdi ?? 0;
    this.idVenta = data.idVenta ?? 0;
    this.aplicaIva = data.aplicaIva ?? false;
    this.numClientesAtendidos = data.numClientesAtendidos ?? 0;
    this.tipoVenta = data.tipoVenta ?? TipoVentaId.Normal;
    this.motivoDevolucion = data.motivoDevolucion ?? null;
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
    this.idVentaComplemento = data.idVentaComplemento ?? 0;
    this.montoTotalVenta = data.montoTotalVenta ?? 0;
    this.montoPagado = data.montoPagado ?? 0;
  }
}
