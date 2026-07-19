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
import {
  ProcesoProduccionAgranel,
  ProcesoProduccionAgranelModel,
} from 'src/app/admin/models/produccion-agranel/proceso-produccion-agranel';
import { AgregarProduccionAgranelRequest } from 'src/app/admin/models/produccion-agranel/agregar-produccion-agranel-request';
import { AprobarProduccionAgranelRequest } from 'src/app/admin/models/produccion-agranel/aprobar-produccion-agranel-request';
import { AgregarEnvasadoLiquidosRequest } from 'src/app/admin/models/produccion-agranel/agregar-envasado-liquidos-request';

/**
 * Servicio HTTP del módulo "Producción a granel". Migra la pantalla ProduccionAgranel y los
 * webservices AdminProduccionAgranel/AdminLiquidos (envasado) del legado. Sin `q` de texto
 * libre (filtros estructurados: idUsuario, idEstatus, fechaIni, fechaFin). Los catálogos de
 * usuarios/almacenes/productos se reusan de UsuariosService/ProductosService/
 * RelacionLiquidosService (regla 00) — aquí solo vive el catálogo de estatus del proceso.
 */
@Injectable({ providedIn: 'root' })
export class ProduccionAgranelService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.PRODUCCION_AGRANEL}`;

  /** Listado paginado. Filtros extra: idUsuario, idEstatus, idAlmacen, fechaIni, fechaFin. */
  listar(opts: ListarParams = {}): Observable<PagedResult<ProcesoProduccionAgranel>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<ProcesoProduccionAgranel[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<ProcesoProduccionAgranel>> {
    return this.http
      .get<Notificacion<ProcesoProduccionAgranel[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Catálogo de estatus del proceso (la UI antepone la opción "TODOS"). */
  obtenerEstatus(): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(`${this.baseUri}/catalogos/estatus`)
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CatalogoModel(c))));
  }

  /** Alta de producto MPL a producción a granel. */
  agregar(request: AgregarProduccionAgranelRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(this.baseUri, request);
  }

  /** Aprobación/rechazo de renglones pendientes (el estatus final lo calcula la BD). */
  aprobar(request: AprobarProduccionAgranelRequest): Observable<Notificacion<string>> {
    return this.http.patch<Notificacion<string>>(`${this.baseUri}/aprobar`, request);
  }

  /** Registro de envasado de líquidos (granel → producto envasado). */
  agregarEnvasado(request: AgregarEnvasadoLiquidosRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(`${this.baseUri}/envasado`, request);
  }

  private mapPage(
    res: Notificacion<ProcesoProduccionAgranel[]>,
  ): PagedResult<ProcesoProduccionAgranel> {
    return {
      data: (res?.modelo ?? []).map((p) => new ProcesoProduccionAgranelModel(p)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
