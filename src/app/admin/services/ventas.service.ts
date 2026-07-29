import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
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
 * Servicio HTTP del dominio Ventas. Consume `VentasController` (comercializadora-api): núcleo
 * de venta (POS, Bloque A) + consulta/edición de ventas y ventas canceladas (Bloque C).
 * idUsuario/idEstacion/idAlmacen/idRol NUNCA se mandan desde aquí: los resuelve el backend a
 * partir del JWT (regla de seguridad dura de la feature).
 */
@Injectable({ providedIn: 'root' })
export class VentasService {
  private readonly http = inject(HttpClient);
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
