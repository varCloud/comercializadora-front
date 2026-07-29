// Payload para registrar un ingreso de efectivo (apertura de caja o solicitud de efectivo
// durante el turno), réplica de `_IngresoEfectivo.cshtml` + `IngresoEfectivo` action del legado.
// Un archivo = una interfaz + su modelo (regla 11).

import { TipoIngresoEfectivoId } from 'src/app/admin/models/ventas/tipo-ingreso-efectivo';

export interface IngresoEfectivoRequest {
  monto: number;
  idTipoIngresoEfectivo: TipoIngresoEfectivoId;
}

export class IngresoEfectivoRequestModel implements IngresoEfectivoRequest {
  monto: number;
  idTipoIngresoEfectivo: TipoIngresoEfectivoId;

  constructor(data: Partial<IngresoEfectivoRequest> = {}) {
    this.monto = data.monto ?? 0;
    this.idTipoIngresoEfectivo = data.idTipoIngresoEfectivo ?? TipoIngresoEfectivoId.SolicitudEfectivo;
  }
}
