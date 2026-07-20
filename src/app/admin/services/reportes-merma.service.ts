import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, from, map, of, switchMap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
import { NotificationService } from 'src/app/services/notification.service';
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
  MermaItem,
  MermaItemModel,
} from 'src/app/admin/models/reportes-merma/merma-item';

/** Filtros del listado/exportación de "Reportes > Merma". */
export interface MermaReporteFiltros {
  anioCalculo?: number | null;
  mesCalculo?: number | null;
  idAlmacen?: number | null;
  idLineaProducto?: number | null;
}

/** Nombre de archivo por defecto si la API no expone `Content-Disposition` (ver nota abajo). */
const NOMBRE_REPORTE = 'ReporteMerma';

/**
 * Servicio HTTP de "Reportes > Merma". Migra `ReportesController.Merma/ObtenerMerma/
 * ObtenerMesesAnio` del legado (`SP_CONSULTA_MERMA` tal cual, sin `SP_V2_*`).
 *
 * **Paginación en memoria desde el día uno** (a diferencia de `reporte_ventas`, que la agregó
 * como corrección post-aprobación): `SP_CONSULTA_MERMA` no soporta `OFFSET/FETCH` y no se toca,
 * así que la API pagina en memoria (`IPaginationBuilder`, `Notificacion<T[]>` con `links`/`meta`,
 * mismo contrato que `ReportesVentasService.listar`).
 *
 * `exportar()` reusa el mismo patrón dual `Descarga`/`Diferido` (sniff de `Content-Type` sobre un
 * blob) que `ReportesVentasService.exportar` — respeta los filtros activos de pantalla, sin modo
 * "exportar todo" (ver ese archivo para el detalle documentado).
 *
 * `obtenerAnios()`/`obtenerMeses(anio)` migran la cascada Año→Mes del legado
 * (`ReportesDAO.ObtenerAnios`/`ObtenerMeses`), mismo patrón ya usado en `ConsumoMplService`.
 */
@Injectable({ providedIn: 'root' })
export class ReportesMermaService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly baseUri =
    `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.REPORTES}/${URIS_CONFIG.REPORTE_MERMA}`;

  /** Listado paginado. Filtros: anioCalculo, mesCalculo, idAlmacen, idLineaProducto. */
  listar(opts: ListarParams = {}): Observable<PagedResult<MermaItem>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<MermaItem[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<MermaItem>> {
    return this.http
      .get<Notificacion<MermaItem[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Catálogo de años del filtro (rango fijo 2020..año actual, ver `SP_CONSULTA_ANIOS`). */
  obtenerAnios(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/anios`);
  }

  /**
   * Catálogo de meses del año dado (cascada Año → Mes). `anio` es opcional: sin él, la API
   * calcula con el año actual (`coalesce(@anio, year(fechaActual))` dentro del propio SP).
   */
  obtenerMeses(anio?: number | null): Observable<Catalogo[]> {
    const params = anio ? new HttpParams().set('anio', anio) : undefined;
    return this.obtenerCatalogo(`${this.baseUri}/meses`, params);
  }

  /**
   * Exporta a CSV con los MISMOS filtros del listado (respeta filtros activos de pantalla, sin
   * modo "exportar todo"). Respuesta dual: `200 File` (descarga inmediata) o
   * `200 Notificacion<string>` (envío diferido, llega como Blob por el `responseType: 'blob'`
   * fijo; se convierte a texto y se parsea). Los errores (400: sin correo registrado / sin
   * resultados) también llegan con `error.error` como Blob por el mismo motivo.
   */
  exportar(filtros: MermaReporteFiltros = {}): Observable<void> {
    const params = this.buildParams(filtros);
    return this.http
      .get(`${this.baseUri}/exportar`, {
        params,
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        switchMap((res) => this.procesarRespuestaExportacion(res)),
        catchError((err: HttpErrorResponse) => this.procesarErrorExportacion(err)),
      );
  }

  private buildParams(filtros: MermaReporteFiltros): HttpParams {
    let params = new HttpParams();
    if (filtros.anioCalculo) params = params.set('anioCalculo', filtros.anioCalculo);
    if (filtros.mesCalculo) params = params.set('mesCalculo', filtros.mesCalculo);
    if (filtros.idAlmacen) params = params.set('idAlmacen', filtros.idAlmacen);
    if (filtros.idLineaProducto) params = params.set('idLineaProducto', filtros.idLineaProducto);
    return params;
  }

  private obtenerCatalogo(uri: string, params?: HttpParams): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(uri, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CatalogoModel(c))));
  }

  private procesarRespuestaExportacion(res: HttpResponse<Blob>): Observable<void> {
    const blob = res.body;
    const contentType = res.headers.get('Content-Type') ?? '';

    if (!blob || contentType.includes('application/json')) {
      // Diferido: el cuerpo es el JSON de Notificacion<string>, envuelto en un Blob.
      return from((blob ?? new Blob()).text()).pipe(
        map((texto) => {
          const notificacion = this.parseNotificacion(texto);
          this.notify.notify('info', notificacion?.mensaje ?? 'El reporte se enviará por correo.');
        }),
      );
    }

    // Descarga inmediata.
    this.descargarArchivo(blob, res.headers.get('Content-Disposition'));
    return of(void 0);
  }

  private procesarErrorExportacion(err: HttpErrorResponse): Observable<never> {
    const errorBlob = err.error instanceof Blob ? err.error : null;
    if (errorBlob) {
      return from(errorBlob.text()).pipe(
        switchMap((texto) => {
          const notificacion = this.parseNotificacion(texto);
          this.notify.notify('error', notificacion?.mensaje ?? 'No fue posible generar el reporte.');
          return throwError(() => err);
        }),
      );
    }
    this.notify.notify('error', 'No fue posible generar el reporte.');
    return throwError(() => err);
  }

  private parseNotificacion(texto: string): Notificacion<string> | null {
    try {
      return JSON.parse(texto) as Notificacion<string>;
    } catch {
      return null;
    }
  }

  private descargarArchivo(blob: Blob, contentDisposition: string | null): void {
    const nombreArchivo = this.extraerNombreArchivo(contentDisposition) ?? this.nombrePorDefecto();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
  }

  private extraerNombreArchivo(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(contentDisposition);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private nombrePorDefecto(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .slice(0, 15);
    return `${NOMBRE_REPORTE}_${timestamp}.csv`;
  }

  private mapPage(res: Notificacion<MermaItem[]>): PagedResult<MermaItem> {
    return {
      data: (res?.modelo ?? []).map((i) => new MermaItemModel(i)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
