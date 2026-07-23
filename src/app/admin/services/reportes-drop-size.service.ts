import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, from, map, of, switchMap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
import { NotificationService } from 'src/app/services/notification.service';
import {
  EMPTY_LINKS,
  EMPTY_META,
  PagedResult,
} from 'src/app/admin/models/shared/paged-result';
import {
  DropSizeItem,
  DropSizeItemModel,
} from 'src/app/admin/models/reportes-drop-size/drop-size-item';
import { DropSizeSearchParams } from 'src/app/admin/models/reportes-drop-size/drop-size-search-params';

/** Nombre de archivo por defecto si la API no expone `Content-Disposition` (ver nota abajo). */
const NOMBRE_REPORTE = 'ReporteDropSize';

/**
 * Servicio HTTP de "Reportes > Drop Size" (FE-3). Migra `ReportesController.DropSize/
 * ObtenerDropSize` del legado sobre el nuevo `SP_V2_REPORTE_DROPSIZE` (paginado server-side para
 * los 3 tipos, por consistencia con `margen_bruto`/`dias_promedio_inventario`, ver
 * hu_reporte_drop_size.md).
 *
 * `tipo` es **obligatorio** (a diferencia de `dias_promedio_inventario`): la API responde `400`
 * si falta o está fuera de 1-3 — no debería ocurrir en uso normal, el `mat-select` del formulario
 * siempre envía un valor (default Global). `fechaIni`/`fechaFin` son **opcionales**: el SP_V2
 * defaultea a "hoy" internamente si no se envían (igual criterio que `dias_promedio_inventario`,
 * a diferencia de `margen_bruto`) — por eso `buildParams` solo agrega esos dos query params
 * cuando vienen informados.
 *
 * ⚠️ **Quirk de la API — "sin ventas en el rango" viaja como `400`** (no como `200` vacío,
 * verificado contra `ReportesDropSizeController`): el body es `Notificacion<T[]>` con
 * `estatus:-1` (único código de negocio de este reporte, a diferencia de los dos que maneja
 * `dias_promedio_inventario`). `listar()`/`irLink()` detectan este caso y lo normalizan a una
 * página vacía (con aviso `warning` al usuario usando el mensaje literal de la API, regla 14),
 * en vez de propagarlo como error técnico. Cualquier otro `4xx`/`5xx` sí se propaga como error
 * genuino.
 *
 * `exportarCSV()` reusa el mismo patrón dual `Descarga`/`Diferido` (sniff de `Content-Type`
 * sobre un blob) que `ReportesMargenBrutoService.exportarCSV`/`ReportesDiasPromedioInventarioService.exportarCSV`.
 */
@Injectable({ providedIn: 'root' })
export class ReportesDropSizeService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly baseUri =
    `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.REPORTES}/${URIS_CONFIG.REPORTE_DROP_SIZE}`;

  /** GET listado paginado server-side. `tipo` obligatorio; `fechaIni`/`fechaFin` opcionales (default del SP). */
  listar(filtros: DropSizeSearchParams): Observable<PagedResult<DropSizeItem>> {
    const params = this.buildParams(filtros, true);
    return this.http
      .get<Notificacion<DropSizeItem[]>>(this.baseUri, { params })
      .pipe(
        map((res) => this.mapPage(res)),
        catchError((err: HttpErrorResponse) => this.procesarErrorListado(err)),
      );
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<DropSizeItem>> {
    return this.http
      .get<Notificacion<DropSizeItem[]>>(url)
      .pipe(
        map((res) => this.mapPage(res)),
        catchError((err: HttpErrorResponse) => this.procesarErrorListado(err)),
      );
  }

  /**
   * Exporta a CSV con los MISMOS filtros del listado (tipo/fechaIni/fechaFin), sin paginar.
   * Respuesta dual: `200 File` (descarga inmediata) o `200 Notificacion<string>` (envío
   * diferido por correo; llega como Blob por el `responseType: 'blob'` fijo, se convierte a
   * texto y se parsea). Los errores también llegan con `error.error` como Blob por el mismo
   * motivo.
   */
  exportarCSV(filtros: DropSizeSearchParams): Observable<void> {
    const params = this.buildParams(filtros, false);
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

  /** `fechaIni`/`fechaFin` solo se agregan si vienen informados (opcionales, default del SP). */
  private buildParams(filtros: DropSizeSearchParams, incluirPaginacion: boolean): HttpParams {
    let params = new HttpParams().set('tipo', filtros.tipo);
    if (filtros.fechaIni) {
      params = params.set('fechaIni', filtros.fechaIni);
    }
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }
    if (incluirPaginacion) {
      params = params.set('page', filtros.page ?? 1).set('perPage', filtros.perPage ?? 25);
    }
    return params;
  }

  /**
   * Distingue el quirk "sin ventas" (`400` con `estatus:-1`, ver clase) de un error real: si lo
   * detecta, avisa con el mensaje literal de la API (regla 14) y resuelve como página vacía en
   * vez de propagar el error. Cualquier otro `4xx`/`5xx` se notifica como error y se propaga.
   */
  private procesarErrorListado(err: HttpErrorResponse): Observable<PagedResult<DropSizeItem>> {
    const body = err.error as Notificacion<DropSizeItem[]> | null;
    if (err.status === 400 && body?.estatus === -1) {
      this.notify.notify(
        'warning',
        body?.mensaje ?? 'No se encontraron ventas para calcular el indicador dropsize, con esos términos de búsqueda.',
      );
      return of({ data: [], links: { ...EMPTY_LINKS }, meta: { ...EMPTY_META } });
    }
    console.error(err);
    this.notify.notify('error', body?.mensaje ?? 'No fue posible consultar el reporte de drop size.');
    return throwError(() => err);
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
          // El mismo quirk "sin ventas" (estatus:-1) puede aplicar también a exportar: se avisa
          // como warning (no como error técnico) aunque el HTTP status sea 400.
          const tipo = notificacion?.estatus === -1 ? 'warning' : 'error';
          this.notify.notify(tipo, notificacion?.mensaje ?? 'No fue posible generar el reporte.');
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

  private mapPage(res: Notificacion<DropSizeItem[]>): PagedResult<DropSizeItem> {
    return {
      data: (res?.modelo ?? []).map((i) => new DropSizeItemModel(i)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
