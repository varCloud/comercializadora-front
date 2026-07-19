import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
import { Catalogo, CatalogoModel } from 'src/app/admin/models/shared/catalogo';
import {
  EMPTY_LINKS,
  EMPTY_META,
  PagedResult,
} from 'src/app/admin/models/shared/paged-result';
import {
  ListarParams,
  buildListParams,
} from 'src/app/admin/models/shared/listar-params';
import { Bitacora, BitacoraModel } from 'src/app/admin/models/bitacoras/bitacora';
import {
  BitacoraDetalle,
  BitacoraDetalleModel,
} from 'src/app/admin/models/bitacoras/bitacora-detalle';

/**
 * Servicio HTTP del reporte "Bitácoras" (consulta de pedidos internos = traspasos entre
 * almacenes). Migra la pantalla Bitacoras del legado (BitacoraController). Solo lectura:
 * listado paginado + timeline de estatus de un folio + catálogo de estatus. Filtros
 * estructurados (sin `q` de texto libre). Los catálogos de almacenes/usuarios/productos se
 * reusan de UsuariosService/ProductosService (regla 00) — aquí solo vive el de estatus.
 */
@Injectable({ providedIn: 'root' })
export class BitacorasService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.BITACORAS}`;

  /** Listado paginado. Filtros: idPedidoInterno, idEstatusPedidoInterno, idAlmacenOrigen,
   *  idAlmacenDestino, idUsuario, idProducto, fechaIni, fechaFin. */
  listar(opts: ListarParams = {}): Observable<PagedResult<Bitacora>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<Bitacora[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<Bitacora>> {
    return this.http
      .get<Notificacion<Bitacora[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Timeline de cambios de estatus de un folio (orden cronológico ascendente). */
  obtenerDetalle(idPedidoInterno: number): Observable<BitacoraDetalle[]> {
    return this.http
      .get<Notificacion<BitacoraDetalle[]>>(`${this.baseUri}/${idPedidoInterno}/detalle`)
      .pipe(map((res) => (res?.modelo ?? []).map((d) => new BitacoraDetalleModel(d))));
  }

  /** Catálogo de estatus de pedidos internos (la UI antepone la opción "TODOS"). */
  obtenerEstatus(): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(`${this.baseUri}/catalogos/estatus`)
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CatalogoModel(c))));
  }

  private mapPage(res: Notificacion<Bitacora[]>): PagedResult<Bitacora> {
    return {
      data: (res?.modelo ?? []).map((b) => new BitacoraModel(b)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
