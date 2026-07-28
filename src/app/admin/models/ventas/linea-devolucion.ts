// Línea del modo Devolución del POS: envuelve el `VentaDetalle` original localizado por código
// de barras (`VentasService.buscarPorCodigoBarras` + `obtenerPorId`) con la cantidad que el
// cajero captura para devolver en esta transacción. Un archivo = una interfaz + su modelo
// (regla 11). Réplica de la tabla `#tablaRepVentas` en modo devolución de `EvtVentas.js`
// (columnas cells[4]=cantidad comprada, cells[7]=cantidad a devolver, cells[9]=comisión
// bancaria de la línea) y de `actualizarSubTotalDevoluciones()` (prorrateo de comisión).

import { VentaDetalle, VentaDetalleModel } from 'src/app/admin/models/ventas/venta-detalle';

export interface LineaDevolucion {
  detalle: VentaDetalle;
  /** Cantidad que el cajero captura para devolver en esta transacción (0 = no se devuelve esta línea). */
  cantidadDevolver: number;
}

export class LineaDevolucionModel implements LineaDevolucion {
  detalle: VentaDetalle;
  cantidadDevolver: number;

  constructor(data: Partial<LineaDevolucion> = {}) {
    this.detalle = new VentaDetalleModel(data.detalle ?? {});
    this.cantidadDevolver = data.cantidadDevolver ?? 0;
  }
}
