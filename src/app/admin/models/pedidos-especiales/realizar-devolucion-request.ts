// Registra una devolución de productos sobre un pedido especial ya entregado
// (POST /pedidos-especiales/{folio}/devolucion). Mapea 1:1 `RealizarDevolucionRequest` de
// comercializadora-api. `idUsuario` NUNCA viaja aquí: el backend lo toma del JWT (misma regla
// dura del resto del feature). `montoDevuelto` **debe coincidir exactamente** con la suma de
// `cantidadDevuelta * precioVenta` + comisión bancaria prorrateada de las líneas devueltas — el
// SP lo valida y rechaza la operación si no calza (réplica exacta de
// `actualizarSubTotalDevoluciones()` en `EvtConsultaPedidosEspecialesV2.js`, calculada en el
// diálogo "Registrar Devolución"). Un archivo = una interfaz + su modelo (regla 09/11).
import {
  ProductoDevueltoRequest,
  ProductoDevueltoRequestModel,
} from 'src/app/admin/models/pedidos-especiales/producto-devuelto-request';

export interface RealizarDevolucionRequest {
  productos: ProductoDevueltoRequest[];
  montoDevuelto: number;
  motivoDevolucion: string | null;
}

export class RealizarDevolucionRequestModel implements RealizarDevolucionRequest {
  productos: ProductoDevueltoRequest[];
  montoDevuelto: number;
  motivoDevolucion: string | null;

  constructor(data: Partial<RealizarDevolucionRequest> = {}) {
    this.productos = (data.productos ?? []).map((p) => new ProductoDevueltoRequestModel(p));
    this.montoDevuelto = data.montoDevuelto ?? 0;
    this.motivoDevolucion = data.motivoDevolucion ?? null;
  }
}
