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
  RelacionTrapeador,
  RelacionTrapeadorModel,
} from 'src/app/admin/models/relacion-trapeadores/relacion-trapeador';
import { GuardarRelacionTrapeadorRequest } from 'src/app/admin/models/relacion-trapeadores/guardar-relacion-trapeador-request';

/**
 * Servicio HTTP del módulo "Relación Trapeadores" (combinaciones materia prima/matra + bastón →
 * trapeador a fabricar). Consume la API nueva (comercializadora-api). Listado paginado
 * (Notificacion con modelo/links/meta); navegación por links (irLink). A diferencia de Relación
 * Líquidos, esta API no expone un endpoint de productos por `tipo`: los selectores de producto se
 * alimentan directo de `ProductosService.buscarPaginado`.
 */
@Injectable({ providedIn: 'root' })
export class RelacionTrapeadoresService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.RELACION_TRAPEADORES}`;

  /** Listado paginado. `q` busca por las descripciones de los 3 productos. */
  listar(opts: ListarParams = {}): Observable<PagedResult<RelacionTrapeador>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<RelacionTrapeador[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last). */
  irLink(url: string): Observable<PagedResult<RelacionTrapeador>> {
    return this.http
      .get<Notificacion<RelacionTrapeador[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  obtenerPorId(id: number): Observable<RelacionTrapeador | null> {
    return this.http
      .get<Notificacion<RelacionTrapeador>>(`${this.baseUri}/${id}`)
      .pipe(map((res) => (res?.modelo ? new RelacionTrapeadorModel(res.modelo) : null)));
  }

  crear(request: GuardarRelacionTrapeadorRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(this.baseUri, request);
  }

  actualizar(id: number, request: GuardarRelacionTrapeadorRequest): Observable<Notificacion<string>> {
    return this.http.put<Notificacion<string>>(`${this.baseUri}/${id}`, request);
  }

  desactivar(id: number): Observable<Notificacion<string>> {
    return this.http.delete<Notificacion<string>>(`${this.baseUri}/${id}`);
  }

  /** Catálogo de unidades de medida válidas para el módulo (Kg/Gr). */
  obtenerUnidadesMedida(): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(`${this.baseUri}/unidades-medida`)
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CatalogoModel(c))));
  }

  private mapPage(res: Notificacion<RelacionTrapeador[]>): PagedResult<RelacionTrapeador> {
    return {
      data: (res?.modelo ?? []).map((r) => new RelacionTrapeadorModel(r)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
