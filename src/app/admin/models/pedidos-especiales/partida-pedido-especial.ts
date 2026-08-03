// Una partida (línea) del formulario "Nuevo Pedido" (alta de pedido especial, Bloque A).
// Combina el producto elegido por el buscador + su precio por volumen (rangos, reusados de
// `admin/models/productos/rango-precio`, regla 00) + la existencia en el almacén seleccionado.
// Estado 100% del cliente (front): NO mapea un DTO de la API 1:1 (la API solo recibe
// `PedidoEspecialProductoRequest` con idProducto/cantidad/idAlmacen al guardar, ver
// `pedido-especial-producto-request.ts`). Un archivo = una interfaz + su modelo (regla 09/11).
//
// `precio` se recalcula en vivo (ver `NuevoPedidoComponent.recalcularPrecios`, réplica de
// `calculaTotales()`/`actualizaTicketVenta()` del legado, ya migrada en el POS de Ventas):
// - Cantidad TOTAL del pedido (todas las partidas) >= 6 → precioMenudeo, si no precioIndividual.
// - Si la cantidad de ESTA partida cae dentro de alguno de sus `rangos` propios → el costo de
//   ese rango gana sobre el default anterior.
// - Si excede el `max` de todos sus rangos → se usa el costo del rango de mayor `max`.

import { RangoPrecio, RangoPrecioModel } from 'src/app/admin/models/productos/rango-precio';

export interface PartidaPedidoEspecial {
  idProducto: number;
  descripcion: string;
  codigoBarras: string;
  cantidad: number;
  /** Precio unitario normal ("Precio Menudeo" en UI, ver nota en precios-producto.ts). */
  precioIndividual: number;
  /** Precio aplicado por defecto cuando el pedido completo alcanza 6+ artículos. */
  precioMenudeo: number;
  /** Precio realmente aplicado a la partida tras evaluar cantidad total + rangos propios. */
  precio: number;
  /** Existencia en el almacén seleccionado. -1 = aún no consultada. */
  existencia: number;
  /** true = sin existencia disponible (`ExistenciaProductoAlmacen.inhabilitado` de la API). */
  inhabilitado: boolean;
  /** Rangos propios de precio por volumen del producto (cargados al agregarlo, `obtenerPrecios`). */
  rangos: RangoPrecio[];
}

export class PartidaPedidoEspecialModel implements PartidaPedidoEspecial {
  idProducto: number;
  descripcion: string;
  codigoBarras: string;
  cantidad: number;
  precioIndividual: number;
  precioMenudeo: number;
  precio: number;
  existencia: number;
  inhabilitado: boolean;
  rangos: RangoPrecio[];

  constructor(data: Partial<PartidaPedidoEspecial> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.codigoBarras = data.codigoBarras ?? '';
    this.cantidad = data.cantidad ?? 0;
    this.precioIndividual = data.precioIndividual ?? 0;
    this.precioMenudeo = data.precioMenudeo ?? 0;
    this.precio = data.precio ?? 0;
    this.existencia = data.existencia ?? -1;
    this.inhabilitado = data.inhabilitado ?? false;
    this.rangos = (data.rangos ?? []).map((r) => new RangoPrecioModel(r));
  }
}
