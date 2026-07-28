// Línea de cálculo de precio por volumen (POST /ventas/precio-volumen). Mapea 1:1 la entidad
// `PrecioVolumen` de comercializadora-api. Se envía en lote para todo el ticket porque el
// descuento por volumen se evalúa por la cantidad TOTAL del producto en el ticket completo, no
// línea por línea. Hoy NO se usa desde el POS (ver decisión documentada en
// `venta.service.ts`/memoria de la feature: el cálculo de precio por volumen se mantiene
// client-side, replicando `actualizaTicketVenta()` del legado); el método del servicio existe
// para cubrir el contrato completo de la API y quedar listo si se necesita en otro flujo
// (p. ej. Pedidos Especiales, que en el legado sí lo consume).
// Un archivo = una interfaz + su modelo (regla 11).

export interface PrecioVolumen {
  contador: number;
  idProducto: number;
  min: number;
  max: number;
  costo: number;
  descuento: number;
  activo: boolean;
  idTipoPrecio: number;
  cantidad: number;
  porcUtilidad: number;
}

export class PrecioVolumenModel implements PrecioVolumen {
  contador: number;
  idProducto: number;
  min: number;
  max: number;
  costo: number;
  descuento: number;
  activo: boolean;
  idTipoPrecio: number;
  cantidad: number;
  porcUtilidad: number;

  constructor(data: Partial<PrecioVolumen> = {}) {
    this.contador = data.contador ?? 0;
    this.idProducto = data.idProducto ?? 0;
    this.min = data.min ?? 0;
    this.max = data.max ?? 0;
    this.costo = data.costo ?? 0;
    this.descuento = data.descuento ?? 0;
    this.activo = data.activo ?? true;
    this.idTipoPrecio = data.idTipoPrecio ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.porcUtilidad = data.porcUtilidad ?? 0;
  }
}
