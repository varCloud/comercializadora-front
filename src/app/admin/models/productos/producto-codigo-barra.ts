// Ítem que se envía al generador de etiquetas de código de barras (POST .../codigos-barras/generar).
// Subconjunto de Producto con lo que se imprime en la etiqueta (regla 11: interface + modelo).
// Nombres de campo = contrato JSON de la API (español). Naming legado: precioIndividual se rotula
// "Menudeo" y precioMenudeo se rotula "Mayoreo" en la etiqueta.

import { Producto } from 'src/app/admin/models/productos/producto';

export interface ProductoCodigoBarra {
  idProducto: number;
  descripcion: string;
  descripcionLinea: string;
  precioIndividual: number | null;
  precioMenudeo: number | null;
  codigoBarras: string;
}

export class ProductoCodigoBarraModel implements ProductoCodigoBarra {
  idProducto: number;
  descripcion: string;
  descripcionLinea: string;
  precioIndividual: number | null;
  precioMenudeo: number | null;
  codigoBarras: string;

  constructor(data: Partial<ProductoCodigoBarra> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.descripcionLinea = data.descripcionLinea ?? '';
    this.precioIndividual = data.precioIndividual ?? null;
    this.precioMenudeo = data.precioMenudeo ?? null;
    this.codigoBarras = data.codigoBarras ?? '';
  }

  /** Construye el ítem a imprimir a partir de un Producto del catálogo. */
  static fromProducto(p: Producto): ProductoCodigoBarraModel {
    return new ProductoCodigoBarraModel({
      idProducto: p.idProducto,
      descripcion: p.descripcion,
      descripcionLinea: p.descripcionLinea,
      precioIndividual: p.precioIndividual,
      precioMenudeo: p.precioMenudeo,
      codigoBarras: p.codigoBarras,
    });
  }
}
