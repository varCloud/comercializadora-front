// Compra a proveedor (cabecera) como la devuelve la API (listado SP_V2_CONSULTA_COMPRAS y
// cabecera de SP_V2_CONSULTA_COMPRA_DETALLE). Un archivo = una interfaz + su modelo (regla 11).
// En la lectura por id trae además el detalle de productos (listProductos).

import {
  CompraProducto,
  CompraProductoModel,
} from 'src/app/admin/models/compras/compra-producto';

export interface Compra {
  idCompra: number;
  fechaAlta: string;
  observaciones: string;
  idAlmacen: number;
  almacen: string;
  idProveedor: number;
  proveedorNombre: string;
  idStatus: number;
  estatusDescripcion: string;
  idUsuario: number;
  nombreCompleto: string;
  montoTotal: number;
  totalCantProductos: number;
  totalCantProductosRecibidos: number;
  totalCantProductosDevueltos: number;
  montoTotalRecibido: number;
  estadoCompra: number;
  listProductos: CompraProducto[];
}

export class CompraModel implements Compra {
  idCompra: number;
  fechaAlta: string;
  observaciones: string;
  idAlmacen: number;
  almacen: string;
  idProveedor: number;
  proveedorNombre: string;
  idStatus: number;
  estatusDescripcion: string;
  idUsuario: number;
  nombreCompleto: string;
  montoTotal: number;
  totalCantProductos: number;
  totalCantProductosRecibidos: number;
  totalCantProductosDevueltos: number;
  montoTotalRecibido: number;
  estadoCompra: number;
  listProductos: CompraProducto[];

  constructor(data: Partial<Compra> = {}) {
    this.idCompra = data.idCompra ?? 0;
    this.fechaAlta = data.fechaAlta ?? '';
    this.observaciones = data.observaciones ?? '';
    this.idAlmacen = data.idAlmacen ?? 0;
    this.almacen = data.almacen ?? '';
    this.idProveedor = data.idProveedor ?? 0;
    this.proveedorNombre = data.proveedorNombre ?? '';
    this.idStatus = data.idStatus ?? 0;
    this.estatusDescripcion = data.estatusDescripcion ?? '';
    this.idUsuario = data.idUsuario ?? 0;
    this.nombreCompleto = data.nombreCompleto ?? '';
    this.montoTotal = data.montoTotal ?? 0;
    this.totalCantProductos = data.totalCantProductos ?? 0;
    this.totalCantProductosRecibidos = data.totalCantProductosRecibidos ?? 0;
    this.totalCantProductosDevueltos = data.totalCantProductosDevueltos ?? 0;
    this.montoTotalRecibido = data.montoTotalRecibido ?? 0;
    this.estadoCompra = data.estadoCompra ?? 0;
    this.listProductos = (data.listProductos ?? []).map(
      (p) => new CompraProductoModel(p),
    );
  }
}
