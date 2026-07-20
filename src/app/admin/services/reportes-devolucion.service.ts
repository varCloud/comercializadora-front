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
  ListarParams,
  buildListParams,
} from 'src/app/admin/models/shared/listar-params';
import {
  DevolucionItem,
  DevolucionItemModel,
} from 'src/app/admin/models/reportes-devolucion/devolucion-item';

/** Filtros del listado/exportación de "Reportes > Devoluciones". fechaIni/fechaFin obligatorios. */
export interface DevolucionReporteFiltros {
  fechaIni: string;
  fechaFin: string;
  idAlmacen?: number | null;
  idUsuario?: number | null;
  tipoTicket?: number | null;
}

/** Nombre de archivo por defecto si la API no expone `Content-Disposition` (ver nota abajo). */
const NOMBRE_REPORTE = 'ReporteDevoluciones';

/**
 * Servicio HTTP de "Reportes > Devoluciones". Migra `ReportesController.Devoluciones/
 * ObtenerDevolucionesyComplementos` del legado (`SP_CONSULTA_DEVOLUCIONES_Y_COMPLEMENTOS` tal
 * cual, sin `SP_V2_*`).
 *
 * **Paginación en memoria desde el día uno** (mismo criterio que `ReportesMermaService`): el SP
 * no soporta `OFFSET/FETCH` y no se toca, así que la API pagina en memoria (`IPaginationBuilder`,
 * `Notificacion<T[]>` con `links`/`meta`, mismo contrato que el resto del módulo Reportes).
 *
 * `exportar()` reusa el mismo patrón dual `Descarga`/`Diferido` (sniff de `Content-Type` sobre un
 * blob) que `ReportesMermaService.exportar`/`ReportesVentasService.exportar` — respeta los
 * filtros activos de pantalla, sin modo "exportar todo" (ver esos archivos para el detalle
 * documentado). Es una excepción al legado (no existía exportación para este reporte).
 *
 * Catálogos de Almacén/Usuario NO se agregan aquí: se reusan directo de `UsuariosService`
 * (regla 00), igual que `ReportesMermaService`/`ReportesVentasService`.
 */
@Injectable({ providedIn: 'root' })
export class ReportesDevolucionService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly baseUri =
    `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.REPORTES}/${URIS_CONFIG.REPORTE_DEVOLUCION}`;

  /** Listado paginado. Filtros: fechaIni/fechaFin (obligatorios), idAlmacen, idUsuario, tipoTicket. */
  listar(opts: ListarParams = {}): Observable<PagedResult<DevolucionItem>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<DevolucionItem[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<DevolucionItem>> {
    return this.http
      .get<Notificacion<DevolucionItem[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  /**
   * Exporta a CSV con los MISMOS filtros del listado (respeta filtros activos de pantalla, sin
   * modo "exportar todo"). Respuesta dual: `200 File` (descarga inmediata) o
   * `200 Notificacion<string>` (envío diferido, llega como Blob por el `responseType: 'blob'`
   * fijo; se convierte a texto y se parsea). Los errores también llegan con `error.error` como
   * Blob por el mismo motivo.
   */
  exportar(filtros: DevolucionReporteFiltros): Observable<void> {
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

  private buildParams(filtros: DevolucionReporteFiltros): HttpParams {
    let params = new HttpParams()
      .set('fechaIni', filtros.fechaIni)
      .set('fechaFin', filtros.fechaFin);
    if (filtros.idAlmacen) params = params.set('idAlmacen', filtros.idAlmacen);
    if (filtros.idUsuario) params = params.set('idUsuario', filtros.idUsuario);
    if (filtros.tipoTicket) params = params.set('tipoTicket', filtros.tipoTicket);
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

  private mapPage(res: Notificacion<DevolucionItem[]>): PagedResult<DevolucionItem> {
    return {
      data: (res?.modelo ?? []).map((i) => new DevolucionItemModel(i)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
