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
  MargenBrutoItem,
  MargenBrutoItemModel,
} from 'src/app/admin/models/reportes-margen-bruto/margen-bruto-item';
import { MargenBrutoSearchParams } from 'src/app/admin/models/reportes-margen-bruto/margen-bruto-search-params';

/** Nombre de archivo por defecto si la API no expone `Content-Disposition` (ver nota abajo). */
const NOMBRE_REPORTE = 'ReporteMargenBruto';

/**
 * Servicio HTTP de "Reportes > Margen Bruto" (FE-3). Migra `ReportesController.MargenBruto/
 * BuscarMargenBruto` del legado sobre el nuevo `SP_V2_REPORTE_MARGEN_BRUTO` (paginado
 * **server-side** para los 4 tipos, a diferencia de los reportes hermanos que paginan en
 * cliente — decisión de la HU por el volumen de `Venta_Producto`, ~3.6M filas sin filtro).
 *
 * `tipo`/`fechaIni`/`fechaFin` son obligatorios: la API responde `400` si falta alguno
 * (no debería ocurrir en uso normal — el formulario ya bloquea "Buscar"/"Exportar" sin fechas).
 *
 * ⚠️ **Quirk de la API — "sin ventas en el rango" también viaja como `400`** (no como `200`
 * vacío): el body es `Notificacion<T[]>` con `estatus:-1` (en vez del `estatus:400` de un error
 * de validación real). `listar()`/`irLink()` detectan este caso puntual y lo normalizan a una
 * página vacía (con aviso `warning` al usuario usando el mensaje literal de la API, regla 14),
 * en vez de propagarlo como error técnico — así el componente no necesita distinguir "sin
 * resultados" de un error real (mismo contrato que cualquier otro listado paginado del repo).
 * Cualquier otro `4xx`/`5xx` sí se propaga como error genuino.
 *
 * `exportarCSV()` reusa el mismo patrón dual `Descarga`/`Diferido` (sniff de `Content-Type`
 * sobre un blob) que `ReportesDevolucionService.exportar`/`ReportesMermaService.exportar`: `≤
 * 1000` filas → descarga inmediata; `> 1000` filas → `Notificacion<string>` avisando envío por
 * correo (ver `hu_reporte_margen_bruto.md` / task file, umbral `Exportacion:UmbralDescargaInmediata`).
 */
@Injectable({ providedIn: 'root' })
export class ReportesMargenBrutoService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly baseUri =
    `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.REPORTES}/${URIS_CONFIG.REPORTE_MARGEN_BRUTO}`;

  /** GET listado paginado server-side. `tipo`/`fechaIni`/`fechaFin` obligatorios. */
  listar(filtros: MargenBrutoSearchParams): Observable<PagedResult<MargenBrutoItem>> {
    const params = this.buildParams(filtros, true);
    return this.http
      .get<Notificacion<MargenBrutoItem[]>>(this.baseUri, { params })
      .pipe(
        map((res) => this.mapPage(res)),
        catchError((err: HttpErrorResponse) => this.procesarErrorListado(err)),
      );
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<MargenBrutoItem>> {
    return this.http
      .get<Notificacion<MargenBrutoItem[]>>(url)
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
  exportarCSV(filtros: MargenBrutoSearchParams): Observable<void> {
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

  private buildParams(filtros: MargenBrutoSearchParams, incluirPaginacion: boolean): HttpParams {
    let params = new HttpParams()
      .set('tipo', filtros.tipo)
      .set('fechaIni', filtros.fechaIni)
      .set('fechaFin', filtros.fechaFin);
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
  private procesarErrorListado(err: HttpErrorResponse): Observable<PagedResult<MargenBrutoItem>> {
    const body = err.error as Notificacion<MargenBrutoItem[]> | null;
    if (err.status === 400 && body?.estatus === -1) {
      this.notify.notify(
        'warning',
        body?.mensaje ?? 'No se encontraron ventas para calcular el margen bruto, con esos términos de búsqueda.',
      );
      return of({ data: [], links: { ...EMPTY_LINKS }, meta: { ...EMPTY_META } });
    }
    console.error(err);
    this.notify.notify('error', body?.mensaje ?? 'No fue posible consultar el reporte de margen bruto.');
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

  private mapPage(res: Notificacion<MargenBrutoItem[]>): PagedResult<MargenBrutoItem> {
    return {
      data: (res?.modelo ?? []).map((i) => new MargenBrutoItemModel(i)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
