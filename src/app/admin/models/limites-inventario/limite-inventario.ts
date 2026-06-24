import { EstatusLimite, EstatusLimiteModel } from './estatus-limite';

// Fila del listado de Límites de Inventario. Llaves camelCase del contrato de la API
// (regla 09). El estatus llega anidado en `estatusInventario`.
export interface LimiteInventario {
  idProducto: number;
  idAlmacen: number;
  idLimiteInventario: number;
  idLineaProducto: number;
  minimo: number;
  maximo: number;
  descripcion: string;
  descripcionAlmacen: string;
  descripcionLineaProducto: string;
  codigoBarras: string;
  cantidadInventario: number;
  cantidadSugerida: number;
  estatusInventario: EstatusLimite | null;
}

export class LimiteInventarioModel implements LimiteInventario {
  idProducto: number;
  idAlmacen: number;
  idLimiteInventario: number;
  idLineaProducto: number;
  minimo: number;
  maximo: number;
  descripcion: string;
  descripcionAlmacen: string;
  descripcionLineaProducto: string;
  codigoBarras: string;
  cantidadInventario: number;
  cantidadSugerida: number;
  estatusInventario: EstatusLimite | null;

  constructor(data: Partial<LimiteInventario> = {}) {
    this.idProducto = data.idProducto ?? 0;
    this.idAlmacen = data.idAlmacen ?? 0;
    this.idLimiteInventario = data.idLimiteInventario ?? 0;
    this.idLineaProducto = data.idLineaProducto ?? 0;
    this.minimo = data.minimo ?? 0;
    this.maximo = data.maximo ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.descripcionAlmacen = data.descripcionAlmacen ?? '';
    this.descripcionLineaProducto = data.descripcionLineaProducto ?? '';
    this.codigoBarras = data.codigoBarras ?? '';
    this.cantidadInventario = data.cantidadInventario ?? 0;
    this.cantidadSugerida = data.cantidadSugerida ?? 0;
    this.estatusInventario = data.estatusInventario
      ? new EstatusLimiteModel(data.estatusInventario)
      : null;
  }
}
