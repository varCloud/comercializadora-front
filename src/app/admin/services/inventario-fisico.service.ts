import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
import {
  EMPTY_LINKS,
  EMPTY_META,
  PagedResult,
} from 'src/app/admin/models/shared/paged-result';
import {
  ListarParams,
  buildListParams,
} from 'src/app/admin/models/shared/listar-params';
import {
  InventarioFisico,
  InventarioFisicoModel,
} from 'src/app/admin/models/inventario-fisico/inventario-fisico';
import {
  AjusteInventarioFisico,
  AjusteInventarioFisicoModel,
} from 'src/app/admin/models/inventario-fisico/ajuste-inventario-fisico';
import { GuardarInventarioFisicoRequest } from 'src/app/admin/models/inventario-fisico/guardar-inventario-fisico-request';
import { ActualizarEstatusInventarioFisicoRequest } from 'src/app/admin/models/inventario-fisico/actualizar-estatus-inventario-fisico-request';

/**
 * Servicio HTTP del módulo "Inventario físico". Migra InventarioFisicoController/
 * InventarioFisicoDAO + evtInventarioFisico.js del legado. Listado paginado server-side
 * (SP_V2_CONSULTA_INVENTARIO_FISICO); la navegación usa los links de la API (irLink).
 * Sin `q` de texto libre (paridad con la pantalla legada: filtros estructurados tipo/fechas).
 * Los catálogos de almacenes/líneas se reusan de UsuariosService/ProductosService (regla 00).
 * idSucursal sale del claim JWT en la API: no se envía desde el front.
 */
@Injectable({ providedIn: 'root' })
export class InventarioFisicoService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.INVENTARIO_FISICO}`;

  /** Listado paginado. Filtros extra: idTipoInventario, fechaIni, fechaFin (order: fecha|nombre|estatus). */
  listar(opts: ListarParams = {}): Observable<PagedResult<InventarioFisico>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<InventarioFisico[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<InventarioFisico>> {
    return this.http
      .get<Notificacion<InventarioFisico[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Alta de inventario físico (queda en estatus 1 "Pendiente"). */
  crear(request: GuardarInventarioFisicoRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(this.baseUri, request);
  }

  /** Renombra un inventario físico (edición inline del nombre en el listado). */
  renombrar(
    id: number,
    request: GuardarInventarioFisicoRequest,
  ): Observable<Notificacion<string>> {
    return this.http.put<Notificacion<string>>(`${this.baseUri}/${id}`, request);
  }

  /** Cambio de estatus: 2 = iniciar, 3 = finalizar y afectar, 4 = cancelar. */
  actualizarEstatus(
    id: number,
    request: ActualizarEstatusInventarioFisicoRequest,
  ): Observable<Notificacion<string>> {
    return this.http.patch<Notificacion<string>>(`${this.baseUri}/${id}/estatus`, request);
  }

  /**
   * Ajustes del inventario (lista completa, sin paginar; el front pagina localmente).
   * idAlmacen/idLineaProducto null o 0 = TODOS. Sin resultados la API responde
   * `estatus: -1, modelo: []` → se materializa como lista vacía (NO es error).
   */
  obtenerAjustes(
    id: number,
    idAlmacen?: number | null,
    idLineaProducto?: number | null,
  ): Observable<AjusteInventarioFisico[]> {
    let params = new HttpParams();
    if (idAlmacen) {
      params = params.set('idAlmacen', idAlmacen);
    }
    if (idLineaProducto) {
      params = params.set('idLineaProducto', idLineaProducto);
    }
    return this.http
      .get<Notificacion<AjusteInventarioFisico[]>>(`${this.baseUri}/${id}/ajustes`, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((a) => new AjusteInventarioFisicoModel(a))));
  }

  private mapPage(res: Notificacion<InventarioFisico[]>): PagedResult<InventarioFisico> {
    return {
      data: (res?.modelo ?? []).map((i) => new InventarioFisicoModel(i)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
