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
  DevolucionProveedorItem,
  DevolucionProveedorItemModel,
} from 'src/app/admin/models/reportes-devoluciones-proveedor/devolucion-proveedor-item';
import { DevolucionProveedorSearchParams } from 'src/app/admin/models/reportes-devoluciones-proveedor/devolucion-proveedor-search-params';

/** Nombre de archivo por defecto si la API no expone `Content-Disposition` (ver nota abajo). */
const NOMBRE_REPORTE = 'ReporteDevolucionesProveedor';

/**
 * Servicio HTTP de "Reportes > Devoluciones a Proveedor" (FE-3). Migra
 * `ReportesController.DevolucionesProveedor/ObtenerDevolucionesProveedor` del legado sobre el
 * nuevo `SP_V2_REPORTE_DEVOLUCIONES_PROVEEDOR` (paginado server-side, contrato verificado en
 * `task_reporte_devoluciones_proveedor.md`).
 *
 * `idProveedor`/`fechaIni`/`fechaFin` son **opcionales**: 0/null en `idProveedor` = todos los
 * proveedores, y sin fechas = histórico completo. A diferencia de `margen_bruto`/`drop_size`, la
 * API **NO** documenta ningún quirk de negocio bajo `400` (`estatus:-1`) para este endpoint — por
 * eso `listar()`/`irLink()` no interceptan errores: se propagan tal cual y el componente los
 * notifica (mismo criterio que `ReportesNivelServicioProveedorService`).
 *
 * `exportarCSV()` reusa el mismo patrón dual `Descarga`/`Diferido` (sniff de `Content-Type` sobre
 * un blob) que el resto de los hermanos de Reportes.
 */
@Injectable({ providedIn: 'root' })
export class ReportesDevolucionesProveedorService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly baseUri =
    `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.REPORTES}/${URIS_CONFIG.REPORTE_DEVOLUCIONES_PROVEEDOR}`;

  /** GET listado paginado server-side. `idProveedor`/`fechaIni`/`fechaFin` opcionales (sin ellas = histórico completo). */
  listar(filtros: DevolucionProveedorSearchParams): Observable<PagedResult<DevolucionProveedorItem>> {
    const params = this.buildParams(filtros, true);
    return this.http
      .get<Notificacion<DevolucionProveedorItem[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<DevolucionProveedorItem>> {
    return this.http
      .get<Notificacion<DevolucionProveedorItem[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  /**
   * Exporta a CSV con los MISMOS filtros del listado (idProveedor/fechaIni/fechaFin), sin
   * paginar. Respuesta dual: `200 File` (descarga inmediata) o `200 Notificacion<string>` (envío
   * diferido por correo; llega como Blob por el `responseType: 'blob'` fijo, se convierte a texto
   * y se parsea). Los errores también llegan con `error.error` como Blob por el mismo motivo.
   */
  exportarCSV(filtros: DevolucionProveedorSearchParams): Observable<void> {
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

  /** `idProveedor`/`fechaIni`/`fechaFin` solo se agregan si vienen informados (todos opcionales). */
  private buildParams(filtros: DevolucionProveedorSearchParams, incluirPaginacion: boolean): HttpParams {
    let params = new HttpParams();
    if (filtros.idProveedor) {
      params = params.set('idProveedor', filtros.idProveedor);
    }
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

  private mapPage(res: Notificacion<DevolucionProveedorItem[]>): PagedResult<DevolucionProveedorItem> {
    return {
      data: (res?.modelo ?? []).map((i) => new DevolucionProveedorItemModel(i)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
