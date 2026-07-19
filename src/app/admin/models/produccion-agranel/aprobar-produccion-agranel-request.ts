// Payload de la aprobación/rechazo de renglones del proceso de producción a granel
// (PATCH /api/produccion-agranel/aprobar). El estatus final lo calcula la BD a partir de la
// cantidad atendida (0 = rechazo total; = solicitada → procesado; menor → rechazo parcial).
// El idUsuario NO viaja en el body: la API lo toma del JWT. Regla 11: interfaz + modelo.

export interface AprobarProduccionAgranelItem {
  idProcesoProduccionAgranel: number;
  idProducto: number;
  idUbicacion: number;
  cantidadAtendida: number;
  observaciones: string | null;
}

export class AprobarProduccionAgranelItemModel implements AprobarProduccionAgranelItem {
  idProcesoProduccionAgranel: number;
  idProducto: number;
  idUbicacion: number;
  cantidadAtendida: number;
  observaciones: string | null;

  constructor(data: Partial<AprobarProduccionAgranelItem> = {}) {
    this.idProcesoProduccionAgranel = data.idProcesoProduccionAgranel ?? 0;
    this.idProducto = data.idProducto ?? 0;
    this.idUbicacion = data.idUbicacion ?? 0;
    this.cantidadAtendida = data.cantidadAtendida ?? 0;
    this.observaciones = data.observaciones ?? null;
  }
}

export interface AprobarProduccionAgranelRequest {
  idAlmacen: number;
  productos: AprobarProduccionAgranelItem[];
}

export class AprobarProduccionAgranelRequestModel implements AprobarProduccionAgranelRequest {
  idAlmacen: number;
  productos: AprobarProduccionAgranelItem[];

  constructor(data: Partial<AprobarProduccionAgranelRequest> = {}) {
    this.idAlmacen = data.idAlmacen ?? 0;
    this.productos = (data.productos ?? []).map((p) => new AprobarProduccionAgranelItemModel(p));
  }
}
