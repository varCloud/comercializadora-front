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
  NivelServicioProveedorItem,
  NivelServicioProveedorItemModel,
} from 'src/app/admin/models/reportes-nivel-servicio-proveedor/nivel-servicio-proveedor-item';
import { NivelServicioProveedorSearchParams } from 'src/app/admin/models/reportes-nivel-servicio-proveedor/nivel-servicio-proveedor-search-params';

/** Nombre de archivo por defecto si la API no expone `Content-Disposition` (ver nota abajo). */
const NOMBRE_REPORTE = 'ReporteNivelServicioProveedor';

/**
 * Servicio HTTP de "Reportes > Nivel de Servicio Proveedor" (FE-3). Migra
 * `ReportesController.NivelServicioProveedor/ObtenerNivelServicioProveedor` del legado sobre el
 * nuevo `SP_V2_REPORTE_NIVEL_SERVICIO_PROVEEDOR` (paginado **server-side**, decisión de la HU
 * pese al volumen bajo de proveedores — consistencia con `margen_bruto`/`dias_promedio_inventario`).
 *
 * A diferencia de `ReportesMargenBrutoService`, aquí **nada es obligatorio**: `fechaIni`/
 * `fechaFin` ausentes = histórico completo (la API NO responde `400`, verificado por
 * revisor-backend). Por eso `buildParams` solo agrega esos dos query params cuando vienen
 * informados — nunca fuerza un valor vacío. No se documentó ningún quirk de negocio bajo `400`
 * para este endpoint (a diferencia de `margen_bruto`/`dias_promedio_inventario`), así que
 * `listar()`/`irLink()` no interceptan errores: se propagan tal cual y el componente los notifica
 * (mismo criterio que `ReportesDevolucionService`).
 *
 * `exportarCSV()` reusa el mismo patrón dual `Descarga`/`Diferido` (sniff de `Content-Type` sobre
 * un blob) que `ReportesMargenBrutoService.exportarCSV`/`ReportesDiasPromedioInventarioService.exportarCSV`.
 */
@Injectable({ providedIn: 'root' })
export class ReportesNivelServicioProveedorService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly baseUri =
    `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.REPORTES}/${URIS_CONFIG.REPORTE_NIVEL_SERVICIO_PROVEEDOR}`;

  /** GET listado paginado server-side. `fechaIni`/`fechaFin` opcionales (sin ellas = histórico completo). */
  listar(filtros: NivelServicioProveedorSearchParams): Observable<PagedResult<NivelServicioProveedorItem>> {
    const params = this.buildParams(filtros, true);
    return this.http
      .get<Notificacion<NivelServicioProveedorItem[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<NivelServicioProveedorItem>> {
    return this.http
      .get<Notificacion<NivelServicioProveedorItem[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  /**
   * Exporta a CSV con los MISMOS filtros del listado (fechaIni/fechaFin), sin paginar. Respuesta
   * dual: `200 File` (descarga inmediata) o `200 Notificacion<string>` (envío diferido por
   * correo; llega como Blob por el `responseType: 'blob'` fijo, se convierte a texto y se
   * parsea). Los errores también llegan con `error.error` como Blob por el mismo motivo.
   */
  exportarCSV(filtros: NivelServicioProveedorSearchParams): Observable<void> {
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

  /** `fechaIni`/`fechaFin` solo se agregan si vienen informados (ambos opcionales). */
  private buildParams(filtros: NivelServicioProveedorSearchParams, incluirPaginacion: boolean): HttpParams {
    let params = new HttpParams();
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

  private mapPage(res: Notificacion<NivelServicioProveedorItem[]>): PagedResult<NivelServicioProveedorItem> {
    return {
      data: (res?.modelo ?? []).map((i) => new NivelServicioProveedorItemModel(i)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
