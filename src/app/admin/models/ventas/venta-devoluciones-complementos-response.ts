// Respuesta combinada de GET /ventas/{id}/devoluciones-complementos (Bloque C): las dos listas
// de tickets asociados a una venta (el legado hacía dos llamadas independientes al mismo SP con
// @idTipoTicket=1/2; aquí vienen combinadas en una sola respuesta). Mapea 1:1
// `VentaDevolucionesComplementosResponse` de comercializadora-api. Un archivo = una interfaz +
// su modelo (regla 11).

import {
  VentaDevolucionComplemento,
  VentaDevolucionComplementoModel,
} from 'src/app/admin/models/ventas/venta-devolucion-complemento';

export interface VentaDevolucionesComplementosResponse {
  devoluciones: VentaDevolucionComplemento[];
  complementos: VentaDevolucionComplemento[];
}

export class VentaDevolucionesComplementosResponseModel
  implements VentaDevolucionesComplementosResponse
{
  devoluciones: VentaDevolucionComplemento[];
  complementos: VentaDevolucionComplemento[];

  constructor(data: Partial<VentaDevolucionesComplementosResponse> = {}) {
    this.devoluciones = (data.devoluciones ?? []).map(
      (d) => new VentaDevolucionComplementoModel(d),
    );
    this.complementos = (data.complementos ?? []).map(
      (c) => new VentaDevolucionComplementoModel(c),
    );
  }
}
