// Producto del catálogo del POS (equivalente al `arrayProductos` del legado EvtVentas.js:
// carga completa del catálogo con existencias al entrar a la pantalla de Ventas).
// Un archivo = una interfaz + su modelo (regla 11).
//
// NOTA (FE-A5): hoy este catálogo lo alimenta un servicio LOCAL simulado
// (`pos-catalogo-mock.service.ts`) porque la API de Ventas aún no está lista. El modelo
// `Producto` de `admin/models/productos/producto.ts` (API real ya migrada) NO trae
// `existencia` ni `rangos` de precio por volumen agregados en una sola llamada — falta
// resolver ese contrato antes de reemplazar este mock por `ProductosService`.

import { RangoPrecio, RangoPrecioModel } from 'src/app/admin/models/productos/rango-precio';

export interface ProductoVenta {
  idProducto: number;
  descripcion: string;
  codigoBarras: string;
  /** Precio unitario normal ("Precio Menudeo" en UI — ver nota en precios-producto.ts). */
  precioIndividual: number;
  /** Precio aplicado por defecto cuando el ticket completo alcanza 6+ artículos ("Precio Mayoreo"). */
  precioMenudeo: number;
  /** Existencia disponible en almacén (equivalente a `producto.cantidad` del legado). */
  existencia: number;
  /** Permite cantidad decimal (legado: idUnidadMedida Kilogramo/Gramo/Litro/Mililitro). */
  fraccion: boolean;
  /** Rangos propios de precio por volumen del producto (tienen prioridad sobre el 6+ genérico). */
  rangos: RangoPrecio[];
}

export class ProductoVentaModel implements ProductoVenta {
  idProducto: number;
  descripcion: string;
  codigoBarras: string;
  precioIndividual: number;
  precioMenudeo: number;
  existencia: number;
  fraccion: boolean;
  rangos: RangoPrecio[];

  constructor(data: Partial<ProductoVenta> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.codigoBarras = data.codigoBarras ?? '';
    this.precioIndividual = data.precioIndividual ?? 0;
    this.precioMenudeo = data.precioMenudeo ?? 0;
    this.existencia = data.existencia ?? 0;
    this.fraccion = data.fraccion ?? false;
    this.rangos = (data.rangos ?? []).map((r) => new RangoPrecioModel(r));
  }
}
