import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
import { PedidoEspecialProducto } from 'src/app/admin/models/ventas/pedido-especial-producto';
import { FormaPago, FormaPagoModel } from 'src/app/admin/models/ventas/forma-pago';
import { UsoCfdi, UsoCfdiModel } from 'src/app/admin/models/ventas/uso-cfdi';
import { GuardarPedidoEspecialRequest } from 'src/app/admin/models/pedidos-especiales/guardar-pedido-especial-request';
import { GuardarIvaPedidoEspecialRequest } from 'src/app/admin/models/pedidos-especiales/guardar-iva-pedido-especial-request';
import { PedidoEspecial } from 'src/app/admin/models/pedidos-especiales/pedido-especial';
import {
  ExistenciaProductoAlmacen,
  ExistenciaProductoAlmacenModel,
} from 'src/app/admin/models/pedidos-especiales/existencia-producto-almacen';
import {
  PedidoEspecialPendiente,
  PedidoEspecialPendienteModel,
} from 'src/app/admin/models/pedidos-especiales/pedido-especial-pendiente';
import { ProductoConfirmar, ProductoConfirmarModel } from 'src/app/admin/models/pedidos-especiales/producto-confirmar';
import { GuardarConfirmacionRequest } from 'src/app/admin/models/pedidos-especiales/guardar-confirmacion-request';
import { PedidoEnRuta, PedidoEnRutaModel } from 'src/app/admin/models/pedidos-especiales/pedido-en-ruta';
import { Cotizacion, CotizacionModel } from 'src/app/admin/models/pedidos-especiales/cotizacion';
import {
  PedidoEspecialHistorico,
  PedidoEspecialHistoricoModel,
} from 'src/app/admin/models/pedidos-especiales/pedido-especial-historico';
import {
  PedidoEspecialDetalle,
  PedidoEspecialDetalleModel,
} from 'src/app/admin/models/pedidos-especiales/pedido-especial-detalle';
import { RealizarDevolucionRequest } from 'src/app/admin/models/pedidos-especiales/realizar-devolucion-request';
import {
  TicketPedidoEspecialResumen,
  TicketPedidoEspecialResumenModel,
} from 'src/app/admin/models/pedidos-especiales/ticket-pedido-especial-resumen';
import {
  ConfiguracionPedidoEspecial,
  ConfiguracionPedidoEspecialModel,
} from 'src/app/admin/models/pedidos-especiales/configuracion-pedido-especial';
import { Catalogo, CatalogoModel } from 'src/app/admin/models/shared/catalogo';

/**
 * Servicio HTTP de Pedidos Especiales. Consume `PedidosEspecialesController`
 * (comercializadora-api), controlador propio (NO el anidado `api/facturas/pedidos-especiales`
 * de `FacturasService`, que es un dominio distinto): "Buscar Pedido Especial" del POS (feature
 * Ventas, Bloque E gap-fix) + núcleo "Nuevo Pedido"/alta (feature Pedidos Especiales, Bloque A).
 * `idUsuario`/`idEstacion`/`idAlmacen` NUNCA se mandan desde aquí: el backend los resuelve del
 * JWT (idUsuario/idEstacion) o viajan explícitos solo cuando el SP los requiere por línea
 * (idAlmacen en `GuardarPedidoEspecialRequest.productos`/`existencia`).
 *
 * Catálogos/servicios de otras features que esta pantalla REUSA (regla 00, no se duplican
 * aquí): clientes (`ClientesService.listar`), búsqueda/precios de producto y almacenes de la
 * sucursal (`ProductosService`/`UbicacionesService`) — se inyectan directo en
 * `NuevoPedidoComponent`, no en este servicio.
 */
@Injectable({ providedIn: 'root' })
export class PedidosEspecialesService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.PEDIDOS_ESPECIALES}`;

  /**
   * Productos de un pedido especial (folio) con cantidad aceptada > 0, listos para agregar al
   * ticket del POS. Devuelve la `Notificacion` completa (no solo `modelo`): cuando el folio no
   * existe / no es tipo especial / no está Finalizado / no pertenece al almacén del usuario /
   * no tiene productos con cantidad aceptada, la API responde `estatus != 200` con `mensaje`
   * describiendo el motivo — el componente debe mostrarlo tal cual con `NotificationService`.
   */
  obtenerProductos(folio: number): Observable<Notificacion<PedidoEspecialProducto[]>> {
    return this.http.get<Notificacion<PedidoEspecialProducto[]>>(`${this.baseUri}/${folio}/productos`);
  }

  // ====================== Bloque A: alta ("Nuevo Pedido") ======================

  /** Alta de un pedido especial (SP_GUARDA_PEDIDO_ESPECIAL_V2). `idUsuario`/`idEstacion` del JWT. */
  guardarPedido(request: GuardarPedidoEspecialRequest): Observable<Notificacion<PedidoEspecial>> {
    return this.http.post<Notificacion<PedidoEspecial>>(this.baseUri, request);
  }

  /**
   * Existencia de un producto puntual en un almacén puntual (SP_CONSULTA_EXISTENCIA_PRODUCTO_ALMACEN).
   * Devuelve la `Notificacion` completa: cuando no hay coincidencia la API puede responder
   * `modelo: null` (el componente lo trata como "sin existencia").
   */
  consultarExistencia(
    idProducto: number,
    idAlmacen: number,
  ): Observable<Notificacion<ExistenciaProductoAlmacen>> {
    const params = new HttpParams().set('idProducto', idProducto).set('idAlmacen', idAlmacen);
    return this.http
      .get<Notificacion<ExistenciaProductoAlmacen>>(`${this.baseUri}/existencia`, { params })
      .pipe(
        map((res) => ({
          ...res,
          modelo: res?.modelo ? new ExistenciaProductoAlmacenModel(res.modelo) : res?.modelo,
        })),
      );
  }

  /** Catálogo de formas de pago (SP_CONSULTA_FORMA_PAGO; mismo SP/entidad que Ventas). */
  obtenerFormasPago(): Observable<FormaPago[]> {
    return this.http
      .get<Notificacion<FormaPago[]>>(`${this.baseUri}/formas-pago`)
      .pipe(map((res) => (res?.modelo ?? []).map((f) => new FormaPagoModel(f))));
  }

  /** Catálogo de usos de CFDI (SP_CONSULTA_USO_CFDI; mismo SP/entidad que Ventas). */
  obtenerUsosCfdi(): Observable<UsoCfdi[]> {
    return this.http
      .get<Notificacion<UsoCfdi[]>>(`${this.baseUri}/usos-cfdi`)
      .pipe(map((res) => (res?.modelo ?? []).map((u) => new UsoCfdiModel(u))));
  }

  /** Ajusta datos fiscales de un pedido especial antes de facturar (SP_GUARDA_IVA_PEDIDO_ESPECIAL_V2). */
  guardarIva(
    folio: number,
    request: GuardarIvaPedidoEspecialRequest,
  ): Observable<Notificacion<PedidoEspecial>> {
    return this.http.put<Notificacion<PedidoEspecial>>(`${this.baseUri}/${folio}/iva`, request);
  }

  /** PDF del ticket de alta de un pedido especial (QuestPDF + ZXing, sin temporales en disco). */
  obtenerTicket(folio: number): Observable<Blob> {
    return this.http.get(`${this.baseUri}/${folio}/ticket`, { responseType: 'blob' });
  }

  // ====================== Bloque B: "Entregar Pedido" / "Confirmar Productos" ======================

  /**
   * Pedidos especiales pendientes de entrega (SP_CONSULTA_PEDIDOS_ESPECIALES_V2). Los tres
   * filtros son opcionales, igual que el legado (0/sin valor = sin filtrar). **No pagina
   * server-side** (el SP legado no pagina) — `EntregarPedidoComponent` aplica paginación +
   * filtro de Cliente/Usuario/búsqueda en cliente sobre el resultado (regla 10, último recurso).
   */
  obtenerPendientesEntrega(
    idPedidoEspecial = 0,
    fechaIni: string | null = null,
    fechaFin: string | null = null,
  ): Observable<PedidoEspecialPendiente[]> {
    let params = new HttpParams();
    if (idPedidoEspecial) params = params.set('idPedidoEspecial', idPedidoEspecial);
    if (fechaIni) params = params.set('fechaIni', fechaIni);
    if (fechaFin) params = params.set('fechaFin', fechaFin);

    return this.http
      .get<Notificacion<PedidoEspecialPendiente[]>>(`${this.baseUri}/pendientes-entrega`, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((p) => new PedidoEspecialPendienteModel(p))));
  }

  /** Productos de un pedido especial para "Confirmar Productos" (SP_CONSULTA_PEDIDOS_ESPECIALES_DETALLE_V2). */
  obtenerProductosConfirmar(folio: number): Observable<ProductoConfirmar[]> {
    return this.http
      .get<Notificacion<ProductoConfirmar[]>>(`${this.baseUri}/${folio}/productos-confirmar`)
      .pipe(map((res) => (res?.modelo ?? []).map((p) => new ProductoConfirmarModel(p))));
  }

  /**
   * Confirma los productos entregados de un pedido especial (SP_CONFIRMAR_PRODUCTOS_PEDIDOS_ESPECIALES_V2).
   * También resuelve aceptar/rechazar y la liquidación de pedidos en ruta — no hay endpoint
   * "aceptar/rechazar" separado (ver `GuardarConfirmacionRequest`). `idUsuarioEntrega` siempre
   * lo resuelve el backend del JWT.
   */
  guardarConfirmacion(folio: number, request: GuardarConfirmacionRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(`${this.baseUri}/${folio}/confirmacion`, request);
  }

  /** Cancela un pedido especial completo (SP_CANCELAR_PEDIDO_ESPECIAL_V2). */
  cancelarPedido(folio: number): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(`${this.baseUri}/${folio}/cancelar`, null);
  }

  /**
   * PDF del ticket de almacén ("para despachadores"): una página por almacén destino del
   * pedido. Mismo patrón QuestPDF + ZXing sin temporales que `obtenerTicket`.
   */
  obtenerTicketAlmacen(folio: number): Observable<Blob> {
    return this.http.get(`${this.baseUri}/${folio}/ticket-almacen`, { responseType: 'blob' });
  }

  // ====================== Bloque C: "Pedidos en Ruta" / "Cotizaciones" ======================

  /**
   * Pedidos especiales en ruta (SP_CONSULTA_PEDIDOS_EN_RUTA_V2). Los tres filtros son
   * opcionales, igual que el legado (0/sin valor = sin filtrar). El SP filtra internamente
   * `idEstatusPedidoEspecial in (9) and liquidado = 0`. **No pagina server-side** —
   * `PedidosEnRutaComponent` aplica paginación + filtro de Usuario/búsqueda en cliente sobre
   * el resultado (regla 10, último recurso).
   */
  obtenerEnRuta(
    idUsuarioRuteo = 0,
    fechaIni: string | null = null,
    fechaFin: string | null = null,
  ): Observable<PedidoEnRuta[]> {
    let params = new HttpParams();
    if (idUsuarioRuteo) params = params.set('idUsuarioRuteo', idUsuarioRuteo);
    if (fechaIni) params = params.set('fechaIni', fechaIni);
    if (fechaFin) params = params.set('fechaFin', fechaFin);

    return this.http
      .get<Notificacion<PedidoEnRuta[]>>(`${this.baseUri}/en-ruta`, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((p) => new PedidoEnRutaModel(p))));
  }

  /**
   * Cotizaciones de pedidos especiales de los últimos 8 días
   * (SP_OBTENER_COTIZACIONES_PEDIDOS_ESPECIALES). Sin parámetros: el SP filtra internamente
   * `idEstatusPedidoEspecial = 2` y la ventana de 8 días. **No pagina server-side** —
   * `CotizacionesComponent` aplica paginación + búsqueda en cliente sobre el resultado
   * (regla 10, último recurso).
   */
  obtenerCotizaciones(): Observable<Cotizacion[]> {
    return this.http
      .get<Notificacion<Cotizacion[]>>(`${this.baseUri}/cotizaciones`)
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CotizacionModel(c))));
  }

  // ====================== Bloque D: "Consultar Pedidos" / detalle / bitácora / devolución ======================

  /**
   * Búsqueda histórica de pedidos especiales (SP_OBTENER_PEDIDOS_ESPECIALES). Los 6 filtros son
   * opcionales, igual que el legado (0/vacío/null = sin filtrar) — **a diferencia de
   * Bloques B/C, este endpoint SÍ filtra los 6 server-side** (no es "último recurso" en cliente).
   * `ConsultarPedidosComponent` solo pagina en cliente el resultado ya filtrado (el SP no
   * pagina), mismo patrón `Paginador<T>` que Bloques B/C.
   */
  buscar(
    idCliente = 0,
    idUsuario = 0,
    idEstatusPedidoEspecial = 0,
    fechaIni: string | null = null,
    fechaFin: string | null = null,
    codigoBarras: string | null = null,
  ): Observable<PedidoEspecialHistorico[]> {
    let params = new HttpParams();
    if (idCliente) params = params.set('idCliente', idCliente);
    if (idUsuario) params = params.set('idUsuario', idUsuario);
    if (idEstatusPedidoEspecial) params = params.set('idEstatusPedidoEspecial', idEstatusPedidoEspecial);
    if (fechaIni) params = params.set('fechaIni', fechaIni);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    if (codigoBarras) params = params.set('codigoBarras', codigoBarras);

    return this.http
      .get<Notificacion<PedidoEspecialHistorico[]>>(`${this.baseUri}/buscar`, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((p) => new PedidoEspecialHistoricoModel(p))));
  }

  /**
   * Detalle de un pedido especial para "Consultar Pedidos" (misma fuente que
   * `obtenerProductosConfirmar` de Bloque B — el legado reusa el mismo SP para ambas pantallas).
   * Alimenta tanto la tabla "Ver Detalle" como el formulario "Registrar Devolución" (réplica de
   * `ObtenerPedidosEspecialesDetalle`, que el legado consume una sola vez para ambos modales).
   */
  obtenerDetalle(folio: number): Observable<PedidoEspecialDetalle[]> {
    return this.http
      .get<Notificacion<PedidoEspecialDetalle[]>>(`${this.baseUri}/${folio}/detalle`)
      .pipe(map((res) => (res?.modelo ?? []).map((p) => new PedidoEspecialDetalleModel(p))));
  }

  /** Registra una devolución de productos sobre un pedido especial ya entregado (SP_REALIZA_DEVOLUCION_PEDIDOS_ESPECIALES). */
  realizarDevolucion(folio: number, request: RealizarDevolucionRequest): Observable<Notificacion<string>> {
    return this.http.post<Notificacion<string>>(`${this.baseUri}/${folio}/devolucion`, request);
  }

  /**
   * Listado de tickets históricos de un pedido especial (SP_CONSULTA_TICKETS_PEDIDO_ESPECIAL).
   * Solo datos crudos (la API no regenera el PDF de cada ticket histórico, ver desviación
   * documentada en Bloque D) — se usa para el diálogo de solo lectura "Tickets".
   */
  obtenerTickets(folio: number): Observable<TicketPedidoEspecialResumen[]> {
    return this.http
      .get<Notificacion<TicketPedidoEspecialResumen[]>>(`${this.baseUri}/${folio}/tickets`)
      .pipe(map((res) => (res?.modelo ?? []).map((t) => new TicketPedidoEspecialResumenModel(t))));
  }

  /**
   * Clientes con al menos un pedido especial (SP_OBTENER_CLIENTES_PEDIDOS_ESPECIALES — catálogo
   * del filtro "Consultar Pedidos"). Reusa el modelo genérico `Catalogo` (mismo shape
   * `{id, descripcion}` que `CatalogoItem` de la API). Sin paginación server-side (el SP no la
   * soporta, ver desviación documentada en Bloque D) — se carga completo para un `ng-select`.
   */
  obtenerClientesCatalogo(): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(`${this.baseUri}/clientes`)
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CatalogoModel(c))));
  }

  /** Usuarios que han dado de alta algún pedido especial (SP_OBTENER_USUARIOS_PEDIDOS_ESPECIALES). Mismo criterio sin paginar que `obtenerClientesCatalogo`. */
  obtenerUsuariosCatalogo(): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(`${this.baseUri}/usuarios`)
      .pipe(map((res) => (res?.modelo ?? []).map((u) => new CatalogoModel(u))));
  }

  /** Catálogo de estatus de pedido especial (SP_OBTENER_ESTATUS_PEDIDOS_ESPECIALES). */
  obtenerEstatusCatalogo(): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(`${this.baseUri}/estatus`)
      .pipe(map((res) => (res?.modelo ?? []).map((e) => new CatalogoModel(e))));
  }

  /**
   * Catálogo de configuración de Pedidos Especiales (SP_OBTENER_CONFIGURACION_PEDIDOS_ESPECIALES).
   * `idConfig` opcional (`null` = todas). Expuesto por completitud del contrato de Bloque D; no
   * lo consume todavía ninguna pantalla de este bloque (los valores conocidos del legado
   * pertenecen al flujo de Cierre Cajas, fuera de alcance — ver el modelo).
   */
  obtenerConfiguracion(idConfig: number | null = null): Observable<ConfiguracionPedidoEspecial[]> {
    let params = new HttpParams();
    if (idConfig) params = params.set('idConfig', idConfig);
    return this.http
      .get<Notificacion<ConfiguracionPedidoEspecial[]>>(`${this.baseUri}/configuracion`, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new ConfiguracionPedidoEspecialModel(c))));
  }
}
