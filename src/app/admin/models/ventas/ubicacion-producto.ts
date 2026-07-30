// Una fila de existencia física de un producto en una ubicación concreta (almacén/piso/pasillo/
// rack). Mapea 1:1 la entidad `UbicacionProducto` de comercializadora-api (una fila por
// ubicación, NO agregado) — `GET /productos/{id}/ubicaciones`. Alimenta el diálogo "Consultar
// Existencias" del POS (feature Ventas, Bloque E gap-fix). Un archivo = una interfaz + su
// modelo (regla 11). Nombres de campo = contrato JSON (camelCase).

export interface UbicacionProducto {
  idInventarioDetalle: number;
  idProducto: number;
  descripcion: string;
  cantidad: number;
  fechaAlta: string;
  fechaActualizacion: string;
  almacen: string;
  pasillo: string;
  raq: string;
  piso: string;
  idPasillo: number;
  idRaq: number;
  idPiso: number;
  idUbicacion: number;
  fraccion: boolean;
  /** Réplica de `Utils.mercanciaAcomodada()` del legado: sin ubicación física asignada aún. */
  sinAcomodar: boolean;
}

export class UbicacionProductoModel implements UbicacionProducto {
  idInventarioDetalle: number;
  idProducto: number;
  descripcion: string;
  cantidad: number;
  fechaAlta: string;
  fechaActualizacion: string;
  almacen: string;
  pasillo: string;
  raq: string;
  piso: string;
  idPasillo: number;
  idRaq: number;
  idPiso: number;
  idUbicacion: number;
  fraccion: boolean;
  sinAcomodar: boolean;

  constructor(data: Partial<UbicacionProducto> = {}) {
    this.idInventarioDetalle = data.idInventarioDetalle ?? 0;
    this.idProducto = data.idProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.cantidad = data.cantidad ?? 0;
    this.fechaAlta = data.fechaAlta ?? '';
    this.fechaActualizacion = data.fechaActualizacion ?? '';
    this.almacen = data.almacen ?? '';
    this.pasillo = data.pasillo ?? '';
    this.raq = data.raq ?? '';
    this.piso = data.piso ?? '';
    this.idPasillo = data.idPasillo ?? 0;
    this.idRaq = data.idRaq ?? 0;
    this.idPiso = data.idPiso ?? 0;
    this.idUbicacion = data.idUbicacion ?? 0;
    this.fraccion = data.fraccion ?? false;
    this.sinAcomodar = data.sinAcomodar ?? false;
  }
}
