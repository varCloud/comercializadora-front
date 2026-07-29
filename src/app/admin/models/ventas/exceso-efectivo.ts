// Usuario/estación con exceso de efectivo pendiente de retirar (`Models/ExcesoEfectivo.cs` del
// legado, `_ExcesoEfectivo.cshtml`). Alimenta la notificación global (badge) de exceso de
// efectivo. Un archivo = una interfaz + su modelo (regla 11).

export interface ExcesoEfectivo {
  idUsuario: number;
  nombre: string;
  ingresos: number;
  retiros: number;
  efectivoDisponible: number;
}

export class ExcesoEfectivoModel implements ExcesoEfectivo {
  idUsuario: number;
  nombre: string;
  ingresos: number;
  retiros: number;
  efectivoDisponible: number;

  constructor(data: Partial<ExcesoEfectivo> = {}) {
    this.idUsuario = data.idUsuario ?? 0;
    this.nombre = data.nombre ?? '';
    this.ingresos = data.ingresos ?? 0;
    this.retiros = data.retiros ?? 0;
    this.efectivoDisponible = data.efectivoDisponible ?? 0;
  }
}
