// Retiro de efectivo (exceso de efectivo o retiro de cierre del día). Mapea 1:1 la entidad
// `Retiros` del legado (`Models/Retiros.cs`) — mismos nombres de campo relevantes para el front
// (se omiten los campos de resumen de cierre duplicados en `CajaInfo`). Un archivo = una
// interfaz + su modelo (regla 11).
//
// NOTA (FE-B3/FE-B4, sin API real todavía): la forma exacta la define `API-B4`
// (`CajaController`); esta interfaz replica el contrato documentado en `task_ventas.md`
// (Bloque B) + el modelo legado. FE-B5 debe verificarla contra el contrato real.

import { TipoRetiroId } from 'src/app/admin/models/ventas/tipo-retiro';
import { EstatusRetiro, EstatusRetiroModel } from 'src/app/admin/models/ventas/estatus-retiro';

export interface Retiro {
  idRetiro: number;
  idCierre: number;
  montoRetiro: number;
  idUsuario: number;
  nombreUsuario: string;
  idEstacion: number;
  nombreEstacion: string;
  idAlmacen: number;
  fechaAlta: string;
  montoAutorizado: number;
  idUsuarioAut: number;
  nombreUsuarioAut: string;
  tipoRetiro: TipoRetiroId;
  estatusRetiro: EstatusRetiro;
}

export class RetiroModel implements Retiro {
  idRetiro: number;
  idCierre: number;
  montoRetiro: number;
  idUsuario: number;
  nombreUsuario: string;
  idEstacion: number;
  nombreEstacion: string;
  idAlmacen: number;
  fechaAlta: string;
  montoAutorizado: number;
  idUsuarioAut: number;
  nombreUsuarioAut: string;
  tipoRetiro: TipoRetiroId;
  estatusRetiro: EstatusRetiro;

  constructor(data: Partial<Retiro> = {}) {
    this.idRetiro = data.idRetiro ?? 0;
    this.idCierre = data.idCierre ?? 0;
    this.montoRetiro = data.montoRetiro ?? 0;
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreUsuario = data.nombreUsuario ?? '';
    this.idEstacion = data.idEstacion ?? 0;
    this.nombreEstacion = data.nombreEstacion ?? '';
    this.idAlmacen = data.idAlmacen ?? 0;
    this.fechaAlta = data.fechaAlta ?? '';
    this.montoAutorizado = data.montoAutorizado ?? 0;
    this.idUsuarioAut = data.idUsuarioAut ?? 0;
    this.nombreUsuarioAut = data.nombreUsuarioAut ?? '';
    this.tipoRetiro = data.tipoRetiro ?? TipoRetiroId.ExcesoEfectivo;
    this.estatusRetiro = new EstatusRetiroModel(data.estatusRetiro ?? {});
  }
}
