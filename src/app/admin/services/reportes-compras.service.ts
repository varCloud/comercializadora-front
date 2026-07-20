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
  CompraReporteItem,
  CompraReporteItemModel,
} from 'src/app/admin/models/reportes-compras/compra-reporte-item';

/** Filtros del listado/exportación de "Reportes > Compras" (todos opcionales, sin cascadas). */
export interface ComprasReporteFiltros {
  idProveedor?: number | null;
  idLineaProducto?: number | null;
  idUsuario?: number | null;
  idStatusCompra?: number | null;
  fechaIni?: string | null;
  fechaFin?: string | null;
}

/** Nombre de archivo por defecto si la API no expone `Content-Disposition` (ver nota abajo). */
const NOMBRE_REPORTE = 'ReporteCompras';

/**
 * Servicio HTTP de "Reportes > Compras". Migra `ReportesController.BuscarCompras` +
 * `ComprasDAO.ObtenerCompras(detalleCompra: true)` del legado, resumido por compra (una fila por
 * compra en vez de por producto).
 *
 * Listado **paginado server-side** desde el día uno (`SP_V2_CONSULTA_COMPRAS_REPORTE`, hermano de
 * `SP_V2_CONSULTA_COMPRAS` que usa el módulo CRUD de Compras — no comparten SP, ver notas de
 * tareas). `exportar()` reusa el mismo patrón dual `Descarga`/`Diferido` (sniff de `Content-Type`
 * sobre un blob) que `ReportesVentasService.exportar` — respeta los filtros activos de pantalla,
 * sin modo "exportar todo".
 *
 * **Catálogos propios del reporte:** a diferencia de Ventas/Merma/Devoluciones (que reusan
 * `ProveedoresService`/`UsuariosService`/`ProductosService`), la API expone catálogos dedicados
 * SIN paginar bajo `api/reportes/compras/*` (`proveedores`, `lineas`, `compradores`, `estatus` —
 * ya aprobados en el bloque API). Se consumen tal cual, mapeando `CatalogoItem{id,descripcion}`
 * al `Catalogo` compartido (regla 00, sin duplicar el modelo).
 */
@Injectable({ providedIn: 'root' })
export class ReportesComprasService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly baseUri =
    `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.REPORTES}/${URIS_CONFIG.REPORTE_COMPRAS}`;

  /** Listado paginado. Filtros: idProveedor, idLineaProducto, idUsuario, idStatusCompra, fechaIni, fechaFin. */
  listar(opts: ListarParams = {}): Observable<PagedResult<CompraReporteItem>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<CompraReporteItem[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<CompraReporteItem>> {
    return this.http
      .get<Notificacion<CompraReporteItem[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Catálogo de proveedores para el filtro (sin paginar, ver nota de clase). */
  obtenerProveedores(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/proveedores`);
  }

  /** Catálogo de líneas de producto para el filtro. */
  obtenerLineas(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/lineas`);
  }

  /** Catálogo de compradores (usuarios) para el filtro. */
  obtenerCompradores(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/compradores`);
  }

  /** Catálogo de estatus de compra para el filtro. */
  obtenerEstatus(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/estatus`);
  }

  /**
   * Exporta a CSV con los MISMOS filtros del listado (respeta filtros activos de pantalla, sin
   * modo "exportar todo"). Respuesta dual: `200 File` (descarga inmediata) o
   * `200 Notificacion<string>` (envío diferido, llega como Blob por el `responseType: 'blob'`
   * fijo; se convierte a texto y se parsea). Los errores también llegan con `error.error` como
   * Blob por el mismo motivo.
   */
  exportar(filtros: ComprasReporteFiltros = {}): Observable<void> {
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

  private buildParams(filtros: ComprasReporteFiltros): HttpParams {
    let params = new HttpParams();
    if (filtros.idProveedor) params = params.set('idProveedor', filtros.idProveedor);
    if (filtros.idLineaProducto) params = params.set('idLineaProducto', filtros.idLineaProducto);
    if (filtros.idUsuario) params = params.set('idUsuario', filtros.idUsuario);
    if (filtros.idStatusCompra) params = params.set('idStatusCompra', filtros.idStatusCompra);
    if (filtros.fechaIni) params = params.set('fechaIni', filtros.fechaIni);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    return params;
  }

  private obtenerCatalogo(uri: string): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(uri)
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

  private mapPage(res: Notificacion<CompraReporteItem[]>): PagedResult<CompraReporteItem> {
    return {
      data: (res?.modelo ?? []).map((c) => new CompraReporteItemModel(c)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
