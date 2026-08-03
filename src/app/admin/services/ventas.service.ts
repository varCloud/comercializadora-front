import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, from, map, Observable, of, switchMap, throwError } from 'rxjs';
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
import { Venta, VentaModel } from 'src/app/admin/models/ventas/venta';
import { GuardarVentaRequest } from 'src/app/admin/models/ventas/guardar-venta-request';
import { PrecioVolumen, PrecioVolumenModel } from 'src/app/admin/models/ventas/precio-volumen';
import { FormaPago, FormaPagoModel } from 'src/app/admin/models/ventas/forma-pago';
import { UsoCfdi, UsoCfdiModel } from 'src/app/admin/models/ventas/uso-cfdi';
import {
  ExistenciaProducto,
  ExistenciaProductoModel,
} from 'src/app/admin/models/ventas/existencia-producto';
import { GuardarIvaRequest } from 'src/app/admin/models/ventas/guardar-iva-request';
import {
  VentaDevolucionesComplementosResponse,
  VentaDevolucionesComplementosResponseModel,
} from 'src/app/admin/models/ventas/venta-devoluciones-complementos-response';

/**
 * Filtros propios del listado de ventas (consulta/edición y canceladas, Bloque C). Mapea
 * `VentasListadoQuery` de comercializadora-api (verificado contra el SP real,
 * `SP_V2_CONSULTA_VENTAS_EDITAR`): `idAlmacen`/`idStatusVenta` NO son filtros del cliente
 * (se resuelven en el backend a partir del JWT/endpoint invocado), a propósito no están aquí.
 * Se combina con `ListarParams` (page/perPage/q/order/sort) al llamar a `listar`/`listarCanceladas`,
 * mismo patrón que `VentaReporteFiltros` en `reportes-ventas.service.ts`.
 */
/**
 * Tipos de ticket PDF que expone `GET /ventas/{id}/ticket-pdf` (API-D2, Bloque D). `devolucion`/
 * `complemento` requieren además `idDevolucion`/`idComplemento` (una venta puede tener varias).
 */
export type TicketVentaTipo =
  | 'venta'
  | 'cancelada'
  | 'devolucion'
  | 'complemento'
  | 'todos'
  | 'despachador';

export interface VentasListadoFiltro {
  idCliente?: number | null;
  idUsuario?: number | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  idFactFormaPago?: number | null;
  codigoBarrasTicket?: string | null;
}

/**
 * Filtros de `GET /ventas/exportar` (FE-4): MISMOS filtros de {@link VentasListadoFiltro} +
 * `q` (búsqueda libre del listado, no forma parte de `VentasListadoFiltro` porque `listar`/
 * `listarCanceladas` la reciben vía `ListarParams.q`). `page`/`perPage` no aplican (el export
 * siempre trae todas las filas que matchean el filtro). `idStatusVenta`/`idAlmacen` los resuelve
 * el backend del JWT/rol, igual que en el listado — nunca se mandan desde aquí.
 */
export interface VentasExportarFiltro extends VentasListadoFiltro {
  q?: string | null;
}

/** Nombre de archivo por defecto si la API no expone `Content-Disposition` (ver nota abajo). */
const NOMBRE_EXPORT_VENTAS = 'ventas';

/**
 * Servicio HTTP del dominio Ventas. Consume `VentasController` (comercializadora-api): núcleo
 * de venta (POS, Bloque A) + consulta/edición de ventas y ventas canceladas (Bloque C).
 * idUsuario/idEstacion/idAlmacen/idRol NUNCA se mandan desde aquí: los resuelve el backend a
 * partir del JWT (regla de seguridad dura de la feature).
 */
@Injectable({ providedIn: 'root' })
export class VentasService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.VENTAS}`;

  /** Registra la venta (SP_REALIZA_VENTA). Devuelve la Notificacion completa (estatus/mensaje). */
  guardar(request: GuardarVentaRequest): Observable<Notificacion<Venta>> {
    return this.http.post<Notificacion<Venta>>(this.baseUri, request);
  }

  /** Encabezado + líneas del ticket de una venta por id. */
  obtenerPorId(id: number): Observable<Venta | null> {
    return this.http
      .get<Notificacion<Venta>>(`${this.baseUri}/${id}`)
      .pipe(map((res) => (res?.modelo ? new VentaModel(res.modelo) : null)));
  }

  /**
   * Localiza venta(s) por el código de barras impreso en el ticket. Usado por los modos
   * Devolución y Complemento del POS (FE-A5b) para localizar el ticket original antes de
   * devolver/agregar productos. El SP devuelve una LISTA, no una sola venta.
   */
  buscarPorCodigoBarras(codigo: string): Observable<Venta[]> {
    return this.http
      .get<Notificacion<Venta[]>>(`${this.baseUri}/codigo-barras/${codigo}`)
      .pipe(map((res) => (res?.modelo ?? []).map((v) => new VentaModel(v))));
  }

  /**
   * Precio aplicable por volumen para el ticket completo (SP_CONSULTA_PRECIO_X_VOLUMEN). POST
   * con el ticket completo en un lote: el descuento se evalúa por la cantidad TOTAL de cada
   * producto en TODO el ticket, no por línea aislada.
   *
   * NOTA (decisión FE-A5a): el POS NO llama este endpoint hoy. El legado (EvtVentas.js,
   * `actualizaTicketVenta()`) calcula el precio por volumen 100% en cliente, sin tocar el
   * servidor en cada tecleo — este método solo lo usa la pantalla de Pedidos Especiales en el
   * legado (`ObtenerPreciosDeProductos` / EvtPedidosEspeciales.js). `PosComponent` replica ese
   * mismo cálculo client-side (ya aprobado por revisor-frontend), usando los `rangos` reales del
   * producto cargados LAZY vía `PosCatalogoService.obtenerRangosProducto` — así no depende de
   * un round-trip por cada cambio de cantidad. Se deja implementado para cubrir el contrato
   * completo de la API y por si un flujo futuro (p. ej. Pedidos Especiales migrado) lo necesita.
   */
  consultarPrecioXVolumen(lineas: PrecioVolumen[]): Observable<PrecioVolumen[]> {
    return this.http
      .post<Notificacion<PrecioVolumen[]>>(`${this.baseUri}/precio-volumen`, lineas)
      .pipe(map((res) => (res?.modelo ?? []).map((p) => new PrecioVolumenModel(p))));
  }

  /** Catálogo de formas de pago (SP_CONSULTA_FORMA_PAGO). */
  obtenerFormasPago(): Observable<FormaPago[]> {
    return this.http
      .get<Notificacion<FormaPago[]>>(`${this.baseUri}/catalogos/formas-pago`)
      .pipe(map((res) => (res?.modelo ?? []).map((f) => new FormaPagoModel(f))));
  }

  /** Catálogo de usos de CFDI (SP_CONSULTA_USO_CFDI). */
  obtenerUsoCfdi(): Observable<UsoCfdi[]> {
    return this.http
      .get<Notificacion<UsoCfdi[]>>(`${this.baseUri}/catalogos/uso-cfdi`)
      .pipe(map((res) => (res?.modelo ?? []).map((u) => new UsoCfdiModel(u))));
  }

  /**
   * Existencia disponible de todos los productos activos en el almacén del usuario autenticado
   * (SP_V2_CONSULTA_EXISTENCIA_PRODUCTOS). Masivo, no por producto: `idAlmacen` se resuelve
   * siempre del JWT en el servidor, nunca se manda desde aquí. `PosCatalogoService` la cruza
   * contra el catálogo de productos por `idProducto`.
   */
  obtenerExistencias(): Observable<ExistenciaProducto[]> {
    return this.http
      .get<Notificacion<ExistenciaProducto[]>>(`${this.baseUri}/existencias`)
      .pipe(map((res) => (res?.modelo ?? []).map((e) => new ExistenciaProductoModel(e))));
  }

  // ====================== Bloque C: consulta/edición + ventas canceladas ======================

  /**
   * Listado paginado de ventas activas (consulta/edición). `idAlmacen` se resuelve del rol en
   * el backend (Admin ve todos los almacenes) — nunca se manda desde aquí.
   */
  listar(opts: ListarParams & VentasListadoFiltro = {}): Observable<PagedResult<Venta>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<Venta[]>>(`${this.baseUri}/listado`, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Mismo listado que {@link listar}, filtrado a ventas canceladas por el backend. */
  listarCanceladas(opts: ListarParams & VentasListadoFiltro = {}): Observable<PagedResult<Venta>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<Venta[]>>(`${this.baseUri}/canceladas`, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last), sirve a ambos listados. */
  irLink(url: string): Observable<PagedResult<Venta>> {
    return this.http.get<Notificacion<Venta[]>>(url).pipe(map((res) => this.mapPage(res)));
  }

  /**
   * Exporta a CSV con los MISMOS filtros del listado activo (FE-4, `GET /ventas/exportar`).
   * Reusa EXACTAMENTE el patrón dual `Descarga`/`Diferido` ya establecido por
   * `ReportesVentasService.exportar`/`ReportesInventarioService.exportar` (sniff de
   * `Content-Type` sobre un blob, ver esos archivos para el detalle documentado): si el total de
   * filas es ≤ umbral responde el archivo CSV (descarga inmediata); si lo supera, responde `200
   * Notificacion<string>` (se difiere y se envía por correo) — llega como Blob por el
   * `responseType: 'blob'` fijo, se convierte a texto y se parsea. Los errores (400: sin correo
   * destino configurado / falla el SP) también llegan con `error.error` como Blob por el mismo
   * motivo. Solo exporta ventas activas (`idStatusVenta` lo fija el backend, no es filtro aquí),
   * así que el componente solo debe ofrecer este botón fuera del modo "Ventas canceladas".
   */
  exportar(filtros: VentasExportarFiltro = {}): Observable<void> {
    const params = this.buildExportarParams(filtros);
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

  /**
   * Exporta a CSV el listado de VENTAS CANCELADAS (`GET /ventas/canceladas/exportar`).
   * Copia literal de {@link exportar} (mismo patrón dual descarga/diferido, mismos filtros
   * {@link VentasExportarFiltro}): la única diferencia es la URL — el estatus (Cancelada) lo
   * fija el backend, nunca es parámetro del cliente.
   */
  exportarCanceladas(filtros: VentasExportarFiltro = {}): Observable<void> {
    const params = this.buildExportarParams(filtros);
    return this.http
      .get(`${this.baseUri}/canceladas/exportar`, {
        params,
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        switchMap((res) => this.procesarRespuestaExportacion(res)),
        catchError((err: HttpErrorResponse) => this.procesarErrorExportacion(err)),
      );
  }

  private buildExportarParams(filtros: VentasExportarFiltro): HttpParams {
    let params = new HttpParams();
    const q = (filtros.q ?? '').toString().trim();
    if (q) params = params.set('q', q);
    if (filtros.idCliente) params = params.set('idCliente', filtros.idCliente);
    if (filtros.idUsuario) params = params.set('idUsuario', filtros.idUsuario);
    if (filtros.idFactFormaPago) params = params.set('idFactFormaPago', filtros.idFactFormaPago);
    if (filtros.codigoBarrasTicket) params = params.set('codigoBarrasTicket', filtros.codigoBarrasTicket);
    if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
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
    const fecha = new Date().toISOString().slice(0, 10); // yyyy-MM-dd
    return `${NOMBRE_EXPORT_VENTAS}_${fecha}.csv`;
  }

  /** Cancela una venta (SP_ELIMINA_VENTA). Sin body: `idUsuario` lo toma el backend del JWT. */
  cancelar(id: number): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(`${this.baseUri}/${id}/cancelar`, null);
  }

  /** Ajusta IVA/datos fiscales de una venta antes de facturar (SP_GUARDA_IVA_VENTA). */
  ajustarIva(id: number, request: GuardarIvaRequest): Observable<Notificacion<Venta>> {
    return this.http.post<Notificacion<Venta>>(`${this.baseUri}/${id}/iva`, request);
  }

  /** Tickets de devolución y complemento asociados a una venta, combinados en una respuesta. */
  obtenerDevolucionesComplementos(
    id: number,
  ): Observable<VentaDevolucionesComplementosResponse> {
    return this.http
      .get<Notificacion<VentaDevolucionesComplementosResponse>>(
        `${this.baseUri}/${id}/devoluciones-complementos`,
      )
      .pipe(map((res) => new VentaDevolucionesComplementosResponseModel(res?.modelo ?? {})));
  }

  /**
   * PDF del ticket de una venta (API-D2, Bloque D). `idDevolucion`/`idComplemento` son
   * obligatorios cuando `tipo` es `devolucion`/`complemento` respectivamente (identifican el
   * ticket específico dentro de la venta, que puede tener varias devoluciones/complementos).
   */
  obtenerTicketPdf(
    idVenta: number,
    tipo: TicketVentaTipo,
    opts: { idDevolucion?: number; idComplemento?: number } = {},
  ): Observable<Blob> {
    let params = new HttpParams().set('tipo', tipo);
    if (opts.idDevolucion) params = params.set('idDevolucion', opts.idDevolucion);
    if (opts.idComplemento) params = params.set('idComplemento', opts.idComplemento);
    return this.http.get(`${this.baseUri}/${idVenta}/ticket-pdf`, {
      params,
      responseType: 'blob',
    });
  }

  private mapPage(res: Notificacion<Venta[]>): PagedResult<Venta> {
    return {
      data: (res?.modelo ?? []).map((v) => new VentaModel(v)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
