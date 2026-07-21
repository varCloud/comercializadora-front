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
  DiasPromedioInventarioItem,
  DiasPromedioInventarioItemModel,
} from 'src/app/admin/models/reportes-dias-promedio-inventario/dias-promedio-inventario-item';
import { DiasPromedioInventarioSearchParams } from 'src/app/admin/models/reportes-dias-promedio-inventario/dias-promedio-inventario-search-params';

/** Nombre de archivo por defecto si la API no expone `Content-Disposition` (ver nota abajo). */
const NOMBRE_REPORTE = 'ReporteDiasPromedioInventario';

/**
 * Servicio HTTP de "Reportes > Días Promedio Inventario" (FE-3). Migra
 * `ReportesController.DiasPromedioInventario/ObtenerDiasPromedioInventario` del legado sobre el
 * nuevo `SP_V2_REPORTE_DIAS_PROMEDIO_INVENTARIO` (paginado server-side, decisión de la HU pese al
 * volumen bajo — máx. ~2,032 filas en tipo Producto).
 *
 * A diferencia de `ReportesMargenBrutoService`, aquí **nada es obligatorio**: `tipo` fuera de
 * 1-3 (o ausente) se defaultea a 1 dentro del SP; `fechaIni`/`fechaFin` ausentes se defaultean a
 * "hoy" dentro del SP (igual que el legado). Por eso `buildParams` solo agrega esos dos query
 * params cuando vienen informados — nunca fuerza un valor vacío.
 *
 * ⚠️ **Quirk de la API — dos casos de negocio viajan como `400`** (verificado contra
 * `ReportesDiasPromedioInventarioController`, no como `200` vacío):
 * - `estatus:-400` — el rango de fechas excede el límite defensivo de 365 días (guardrail nuevo,
 *   sin tocar `InventarioPromedioProducto`).
 * - `estatus:-1` — el backfill no pudo completarse, o no hay filas para el rango pedido (mismo
 *   mensaje del legado; en la práctica no se ha observado un caso real de "sin datos" porque el
 *   backfill inserta una fila por producto activo aunque los valores queden en 0).
 *
 * `listar()`/`irLink()` normalizan ambos casos a una página vacía con aviso `warning` (usando el
 * mensaje literal de la API, regla 14) — mismo criterio que el quirk `estatus:-1` de
 * `ReportesMargenBrutoService`, extendido al segundo código de negocio de este reporte. Cualquier
 * otro `4xx`/`5xx` sí se propaga como error genuino.
 *
 * `exportarCSV()` reusa el mismo patrón dual `Descarga`/`Diferido` (sniff de `Content-Type` sobre
 * un blob) que `ReportesMargenBrutoService.exportarCSV`.
 */
@Injectable({ providedIn: 'root' })
export class ReportesDiasPromedioInventarioService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly baseUri =
    `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.REPORTES}/${URIS_CONFIG.REPORTE_DIAS_PROMEDIO_INVENTARIO}`;

  /** GET listado paginado server-side. `tipo`/`fechaIni`/`fechaFin` opcionales (default del SP). */
  listar(filtros: DiasPromedioInventarioSearchParams): Observable<PagedResult<DiasPromedioInventarioItem>> {
    const params = this.buildParams(filtros, true);
    return this.http
      .get<Notificacion<DiasPromedioInventarioItem[]>>(this.baseUri, { params })
      .pipe(
        map((res) => this.mapPage(res)),
        catchError((err: HttpErrorResponse) => this.procesarErrorListado(err)),
      );
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<DiasPromedioInventarioItem>> {
    return this.http
      .get<Notificacion<DiasPromedioInventarioItem[]>>(url)
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
  exportarCSV(filtros: DiasPromedioInventarioSearchParams): Observable<void> {
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

  /** `fechaIni`/`fechaFin` solo se agregan si vienen informados (ambos opcionales, default del SP). */
  private buildParams(filtros: DiasPromedioInventarioSearchParams, incluirPaginacion: boolean): HttpParams {
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
   * Distingue los dos quirks de negocio del reporte (`400` con `estatus:-400` rango > 365 días,
   * o `estatus:-1` backfill incompleto/sin datos, ver clase) de un error real: si detecta
   * cualquiera de los dos, avisa con el mensaje literal de la API (regla 14) y resuelve como
   * página vacía en vez de propagar el error. Cualquier otro `4xx`/`5xx` se notifica como error
   * y se propaga.
   */
  private procesarErrorListado(err: HttpErrorResponse): Observable<PagedResult<DiasPromedioInventarioItem>> {
    const body = err.error as Notificacion<DiasPromedioInventarioItem[]> | null;
    if (err.status === 400 && (body?.estatus === -400 || body?.estatus === -1)) {
      this.notify.notify(
        'warning',
        body?.mensaje ?? 'No fue posible generar el reporte de días promedio inventario con esos filtros.',
      );
      return of({ data: [], links: { ...EMPTY_LINKS }, meta: { ...EMPTY_META } });
    }
    console.error(err);
    this.notify.notify('error', body?.mensaje ?? 'No fue posible consultar el reporte de días promedio inventario.');
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
          // Mismos quirks de negocio (estatus -400/-1) también pueden aplicar a exportar: se
          // avisan como warning (no como error técnico) aunque el HTTP status sea 400.
          const tipo = notificacion?.estatus === -400 || notificacion?.estatus === -1 ? 'warning' : 'error';
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

  private mapPage(res: Notificacion<DiasPromedioInventarioItem[]>): PagedResult<DiasPromedioInventarioItem> {
    return {
      data: (res?.modelo ?? []).map((i) => new DiasPromedioInventarioItemModel(i)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
