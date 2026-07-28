import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
import { Venta, VentaModel } from 'src/app/admin/models/ventas/venta';
import { GuardarVentaRequest } from 'src/app/admin/models/ventas/guardar-venta-request';
import { PrecioVolumen, PrecioVolumenModel } from 'src/app/admin/models/ventas/precio-volumen';
import { FormaPago, FormaPagoModel } from 'src/app/admin/models/ventas/forma-pago';
import { UsoCfdi, UsoCfdiModel } from 'src/app/admin/models/ventas/uso-cfdi';
import {
  ExistenciaProducto,
  ExistenciaProductoModel,
} from 'src/app/admin/models/ventas/existencia-producto';

/**
 * Servicio HTTP del núcleo de venta (POS), Bloque A de la feature Ventas. Consume
 * `VentasController` (comercializadora-api). idUsuario/idEstacion NUNCA se mandan desde aquí:
 * los resuelve el backend a partir del JWT (regla de seguridad dura de la feature).
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
   * Localiza venta(s) por el código de barras impreso en el ticket (para complementar una venta
   * ya cerrada — fuera de alcance de esta pantalla, FE-A5b). El SP devuelve una LISTA, no una
   * sola venta.
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
}
