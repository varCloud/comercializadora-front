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
  InventarioReporteItem,
  InventarioReporteItemModel,
} from 'src/app/admin/models/reportes-inventario/inventario-reporte-item';

/** Nombre de archivo por defecto si la API no expone `Content-Disposition` (ver nota abajo). */
const NOMBRE_REPORTE: Record<1 | 2, string> = {
  1: 'ReporteInventarioGeneral',
  2: 'ReporteInventarioUbicacion',
};

/**
 * Servicio HTTP de "Reportes > Inventario". Migra `ReportesController.Inventario/
 * BuscarInventario/ReporteGeneral` del legado. Listado paginado (SP_V2_CONSULTA_INVENTARIO)
 * + 2 exportaciones completas que ignoran los filtros de pantalla (paridad legado).
 *
 * `exportar()` es el **primer consumidor en el front** del patrón `Descarga`/`Diferido` de
 * `IExportacionService` (hasta ahora solo existía en la API, ver `InventarioFisicoController.
 * ExportarAjustes`). Documentado en detalle en `.claude/memory/` de este repo.
 */
@Injectable({ providedIn: 'root' })
export class ReportesInventarioService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly baseUri =
    `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.REPORTES}/${URIS_CONFIG.REPORTE_INVENTARIO}`;

  /** Listado paginado. Filtros: idLineaProducto, idAlmacen, fechaIni, fechaFin; `q` búsqueda libre. */
  listar(opts: ListarParams = {}): Observable<PagedResult<InventarioReporteItem>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<InventarioReporteItem[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<InventarioReporteItem>> {
    return this.http
      .get<Notificacion<InventarioReporteItem[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  /**
   * Exporta TODO el inventario a CSV (ignora los filtros de pantalla, paridad legado). `tipo`:
   * 1 = Reporte General, 2 = Reporte por Ubicación.
   *
   * **Respuesta dual de la API** (mismo contrato que `GET /api/inventario-fisico/{id}/ajustes/
   * exportar`): si el total de filas es ≤ umbral responde el **archivo CSV** (descarga
   * inmediata); si lo supera, responde `200 Notificacion<string>` (se difiere y se envía por
   * correo). Este método pide siempre `responseType: 'blob'` (necesario para poder recibir el
   * CSV) y decide la rama mirando el header `Content-Type` de la respuesta:
   * - `application/json` → es el `Notificacion<string>` diferido, pero llega como Blob (por el
   *   `responseType` fijo); se convierte a texto (`blob.text()`) y se parsea. Se notifica el
   *   mensaje con `NotificationService` (regla 04).
   * - cualquier otro (`text/csv`) → es el archivo; se dispara la descarga en el navegador
   *   (`URL.createObjectURL` + `<a download>`).
   *
   * Los errores (400: tipo inválido / usuario sin correo) también llegan con `error.error` como
   * Blob por el mismo motivo; se parsean igual para mostrar el mensaje real de la API en vez de
   * un genérico.
   *
   * Nota: la API no expone `Content-Disposition` vía CORS (`AllowAnyHeader()` no incluye
   * `WithExposedHeaders`), así que el nombre de archivo real del `File(...)` del backend no es
   * legible desde el navegador — se intenta leer igualmente (por si se habilita en el futuro) y
   * si no está, se arma un nombre por defecto client-side con el mismo patrón que usa la API
   * (`{NombreReporte}_{timestamp}.csv`).
   */
  exportar(tipo: 1 | 2): Observable<void> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http
      .get(`${this.baseUri}/exportar`, {
        params,
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        switchMap((res) => this.procesarRespuestaExportacion(res, tipo)),
        catchError((err: HttpErrorResponse) => this.procesarErrorExportacion(err)),
      );
  }

  private procesarRespuestaExportacion(
    res: HttpResponse<Blob>,
    tipo: 1 | 2,
  ): Observable<void> {
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
    this.descargarArchivo(blob, res.headers.get('Content-Disposition'), tipo);
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

  private descargarArchivo(blob: Blob, contentDisposition: string | null, tipo: 1 | 2): void {
    const nombreArchivo = this.extraerNombreArchivo(contentDisposition) ?? this.nombrePorDefecto(tipo);
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

  private nombrePorDefecto(tipo: 1 | 2): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .slice(0, 15);
    return `${NOMBRE_REPORTE[tipo]}_${timestamp}.csv`;
  }

  private mapPage(res: Notificacion<InventarioReporteItem[]>): PagedResult<InventarioReporteItem> {
    return {
      data: (res?.modelo ?? []).map((i) => new InventarioReporteItemModel(i)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
