import { HttpClient } from '@angular/common/http';
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
import { FacturaVenta, FacturaVentaModel } from 'src/app/admin/models/facturas/factura-venta';
import {
  FacturaPedidoEspecial,
  FacturaPedidoEspecialModel,
} from 'src/app/admin/models/facturas/factura-pedido-especial';
import {
  DetalleVentaFactura,
  DetalleVentaFacturaModel,
} from 'src/app/admin/models/facturas/detalle-venta-factura';
import { ReenviarFacturaRequest } from 'src/app/admin/models/facturas/reenviar-factura-request';
import { CancelarFacturaRequest } from 'src/app/admin/models/facturas/cancelar-factura-request';
import { ReenviarFacturaPeRequest } from 'src/app/admin/models/facturas/reenviar-factura-pe-request';
import { CancelarFacturaPeRequest } from 'src/app/admin/models/facturas/cancelar-factura-pe-request';
import { EstatusCancelacionRequest } from 'src/app/admin/models/facturas/estatus-cancelacion-request';
import {
  AcuseEstatusCfdi,
  AcuseEstatusCfdiModel,
} from 'src/app/admin/models/facturas/acuse-estatus-cfdi';

/**
 * Servicio HTTP de las pantallas "Facturas Ventas" y "Facturas Pedidos Especiales" (hermanas,
 * mismo módulo Facturación del back — `FacturasController`). Migra FacturaController +
 * FacturaPedidosEspecialesController + WsFacturaController.ActualizaEstatusCancelacionFactura
 * del legado. Contrato real (cerrado por el bloque API de cada feature):
 * `.claude/docs/feature/migracion_facturas_ventas/` y `.../migracion_facturas_pedidos_esp/`.
 * `estatus-cancelacion` es el único endpoint compartido entre ambas pantallas (flag
 * `esPedidoEspecial`); el resto tiene rutas propias por decisión del migrador (tipado sin
 * ambigüedad de identificador). El catálogo de usuarios para el filtro se reutiliza de
 * UsuariosService (regla 00): no existe un endpoint de catálogo dedicado en `api/facturas`.
 */
@Injectable({ providedIn: 'root' })
export class FacturasService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.FACTURAS}`;
  private readonly baseUriPe = `${this.baseUri}/${URIS_CONFIG.FACTURAS_PEDIDOS_ESPECIALES}`;

  /** Listado paginado. Filtros: idStatusFactura, idUsuario, fechaInicio, fechaFin. */
  listar(opts: ListarParams = {}): Observable<PagedResult<FacturaVenta>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<FacturaVenta[]>>(this.baseUri, { params })
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLink(url: string): Observable<PagedResult<FacturaVenta>> {
    return this.http
      .get<Notificacion<FacturaVenta[]>>(url)
      .pipe(map((res) => this.mapPage(res)));
  }

  /** Detalle de la venta para el diálogo de reenvío (cliente, forma de pago, uso CFDI, conceptos). */
  obtenerDetalle(idVenta: number): Observable<DetalleVentaFactura | null> {
    return this.http
      .get<Notificacion<DetalleVentaFactura>>(`${this.baseUri}/detalle/${idVenta}`)
      .pipe(map((res) => (res?.modelo ? new DetalleVentaFacturaModel(res.modelo) : null)));
  }

  /** Reenvía la factura (PDF + XML) por correo, con copia opcional. */
  reenviar(request: ReenviarFacturaRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(`${this.baseUri}/reenviar`, request);
  }

  /** Cancela la factura ante el PAC (CFDI) y registra el estatus resultante. */
  cancelar(request: CancelarFacturaRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(`${this.baseUri}/cancelar`, request);
  }

  /** Consulta el estatus de cancelación ante el SAT y actualiza la factura si ya fue cancelada. */
  consultarEstatusCancelacion(
    request: EstatusCancelacionRequest,
  ): Observable<Notificacion<AcuseEstatusCfdi>> {
    return this.http
      .post<Notificacion<AcuseEstatusCfdi>>(`${this.baseUri}/estatus-cancelacion`, request)
      .pipe(
        map((res) => ({
          ...res,
          modelo: res?.modelo ? new AcuseEstatusCfdiModel(res.modelo) : null,
        })),
      );
  }

  private mapPage(res: Notificacion<FacturaVenta[]>): PagedResult<FacturaVenta> {
    return {
      data: (res?.modelo ?? []).map((f) => new FacturaVentaModel(f)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }

  // ------------------------------------------------------------------
  // Pedidos especiales (`api/facturas/pedidos-especiales`). Misma forma que ventas, cambia el
  // identificador (idPedidoEspecial en vez de idVenta). `consultarEstatusCancelacion` de arriba
  // se reutiliza tal cual (ya soporta `esPedidoEspecial=true`).
  // ------------------------------------------------------------------

  /** Listado paginado de facturas PE. Filtros: idStatusFactura, idUsuario, fechaInicio, fechaFin. */
  listarPE(opts: ListarParams = {}): Observable<PagedResult<FacturaPedidoEspecial>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<FacturaPedidoEspecial[]>>(this.baseUriPe, { params })
      .pipe(map((res) => this.mapPagePe(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLinkPE(url: string): Observable<PagedResult<FacturaPedidoEspecial>> {
    return this.http
      .get<Notificacion<FacturaPedidoEspecial[]>>(url)
      .pipe(map((res) => this.mapPagePe(res)));
  }

  /** Detalle del pedido especial para el diálogo de reenvío (misma forma que ventas). */
  obtenerDetallePE(idPedidoEspecial: number): Observable<DetalleVentaFactura | null> {
    return this.http
      .get<Notificacion<DetalleVentaFactura>>(`${this.baseUriPe}/detalle/${idPedidoEspecial}`)
      .pipe(map((res) => (res?.modelo ? new DetalleVentaFacturaModel(res.modelo) : null)));
  }

  /** Reenvía la factura PE (PDF + XML) por correo, con copia opcional. */
  reenviarPE(request: ReenviarFacturaPeRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(`${this.baseUriPe}/reenviar`, request);
  }

  /** Cancela la factura PE ante el PAC (CFDI) y registra el estatus resultante. */
  cancelarPE(request: CancelarFacturaPeRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(`${this.baseUriPe}/cancelar`, request);
  }

  private mapPagePe(
    res: Notificacion<FacturaPedidoEspecial[]>,
  ): PagedResult<FacturaPedidoEspecial> {
    return {
      data: (res?.modelo ?? []).map((f) => new FacturaPedidoEspecialModel(f)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }
}
