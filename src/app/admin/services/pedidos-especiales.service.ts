import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion, Sesion } from 'src/app/models/sesion';
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
import { IngresoEfectivoPedidoEspecialRequest } from 'src/app/admin/models/pedidos-especiales/ingreso-efectivo-pedido-especial-request';
import {
  IngresoEfectivoPedidoEspecial,
  IngresoEfectivoPedidoEspecialModel,
} from 'src/app/admin/models/pedidos-especiales/ingreso-efectivo-pedido-especial';
import { RetiroEfectivoPedidoEspecialRequest } from 'src/app/admin/models/pedidos-especiales/retiro-efectivo-pedido-especial-request';
import {
  RetiroEfectivoPedidoEspecial,
  RetiroEfectivoPedidoEspecialModel,
} from 'src/app/admin/models/pedidos-especiales/retiro-efectivo-pedido-especial';
import {
  InfoCierrePedidoEspecial,
  InfoCierrePedidoEspecialModel,
} from 'src/app/admin/models/pedidos-especiales/info-cierre-pedido-especial';
import {
  CierrePedidoEspecialDetalle,
  CierrePedidoEspecialDetalleModel,
} from 'src/app/admin/models/pedidos-especiales/cierre-pedido-especial-detalle';
import { CierrePedidoEspecialRequest } from 'src/app/admin/models/pedidos-especiales/cierre-pedido-especial-request';
import { ValidarUsuarioPedidoEspecialRequest } from 'src/app/admin/models/pedidos-especiales/validar-usuario-pedido-especial-request';
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
  CuentaPorCobrar,
  CuentaPorCobrarModel,
} from 'src/app/admin/models/pedidos-especiales/cuenta-por-cobrar';
import {
  DetalleCuentaPorCobrar,
  DetalleCuentaPorCobrarModel,
} from 'src/app/admin/models/pedidos-especiales/detalle-cuenta-por-cobrar';
import { RealizarAbonoRequest } from 'src/app/admin/models/pedidos-especiales/realizar-abono-request';
import { AbonoRealizado } from 'src/app/admin/models/pedidos-especiales/abono-realizado';

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

  // ====================== Cierre de Caja (feature cierre_caja_pe) ======================
  //
  // Apertura/ingreso de efectivo, retiro por exceso de efectivo, resumen/cierre de estación.
  // idUsuario/idEstacion/idAlmacen NUNCA se mandan desde aquí (JWT), mismo criterio que el resto
  // del servicio. Entidades y endpoints propios del módulo — NO se reusa `CajaService` (Ventas):
  // es un estado de caja independiente (ver HU).

  /**
   * Estado compartido de "caja abierta" de Pedidos Especiales (FE-6). Expuesto como signal de
   * solo lectura para que esta feature y la futura `cuentas_por_cobrar_pe` ("Realizar abono"
   * exige caja abierta) lo consuman sin duplicar la consulta. `null` = todavía no se ha
   * consultado. Se refresca con {@link refrescarCajaAbierta}.
   */
  private readonly _cajaAbierta = signal<boolean | null>(null);
  readonly cajaAbierta = this._cajaAbierta.asReadonly();

  /** Consulta `GET caja/abierta` (reemplaza `ValidaCajaAbierta` del legado) y actualiza {@link cajaAbierta}. */
  refrescarCajaAbierta(): Observable<boolean> {
    return this.http.get<Notificacion<boolean>>(`${this.baseUri}/caja/abierta`).pipe(
      map((res) => res?.modelo ?? false),
      tap((abierta) => this._cajaAbierta.set(abierta)),
    );
  }

  /** Marca localmente la caja como abierta (evita una consulta extra justo tras registrar la apertura). */
  marcarCajaAbierta(): void {
    this._cajaAbierta.set(true);
  }

  /** Marca localmente la caja como cerrada (tras un cierre exitoso). */
  marcarCajaCerrada(): void {
    this._cajaAbierta.set(false);
  }

  /** Apertura de caja (idTipoIngreso=1) o ingreso de efectivo normal (idTipoIngreso=2) — un mismo endpoint cubre ambos casos. */
  guardarIngresoEfectivo(request: IngresoEfectivoPedidoEspecialRequest): Observable<Notificacion<number>> {
    return this.http.post<Notificacion<number>>(`${this.baseUri}/caja/ingreso-efectivo`, request);
  }

  /** Listado de ingresos/aperturas de efectivo del usuario autenticado. `fecha` opcional (null = hoy). */
  obtenerIngresosEfectivo(fecha: string | null = null): Observable<IngresoEfectivoPedidoEspecial[]> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http
      .get<Notificacion<IngresoEfectivoPedidoEspecial[]>>(`${this.baseUri}/caja/ingresos-efectivo`, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((i) => new IngresoEfectivoPedidoEspecialModel(i))));
  }

  /** PDF del comprobante de ingreso/apertura de efectivo (QuestPDF + ZXing, sin temporales). */
  obtenerTicketIngresoEfectivo(idIngreso: number): Observable<Blob> {
    return this.http.get(`${this.baseUri}/caja/ingreso-efectivo/${idIngreso}/ticket`, { responseType: 'blob' });
  }

  /** Retiro por exceso de efectivo. A diferencia de Ventas, el back NO valida tope contra `efectivoDisponible` (ver desviación documentada en la HU). */
  registrarRetiroEfectivo(request: RetiroEfectivoPedidoEspecialRequest): Observable<Notificacion<number>> {
    return this.http.post<Notificacion<number>>(`${this.baseUri}/caja/retiro-efectivo`, request);
  }

  /**
   * Listado de retiros de exceso de efectivo. `idUsuario` siempre forzado a la sesión por el
   * backend (sin excepción por rol, a diferencia de Ventas). No pagina server-side — la
   * paginación queda client-side (ver componente).
   */
  obtenerRetirosEfectivo(
    fecha: string | null = null,
    idAlmacen: number | null = null,
  ): Observable<RetiroEfectivoPedidoEspecial[]> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    if (idAlmacen) params = params.set('idAlmacen', idAlmacen);
    return this.http
      .get<Notificacion<RetiroEfectivoPedidoEspecial[]>>(`${this.baseUri}/caja/retiros-efectivo`, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((r) => new RetiroEfectivoPedidoEspecialModel(r))));
  }

  /** PDF del comprobante de retiro por exceso de efectivo. */
  obtenerTicketRetiroEfectivo(idRetiro: number): Observable<Blob> {
    return this.http.get(`${this.baseUri}/caja/retiro-efectivo/${idRetiro}/ticket`, { responseType: 'blob' });
  }

  /** Resumen ligero para validar el retiro de exceso de efectivo (efectivo disponible). NO es el resumen de "Cierre de Caja" (ver {@link obtenerCierreDia}). */
  obtenerInfoCierre(): Observable<InfoCierrePedidoEspecial> {
    return this.http
      .get<Notificacion<InfoCierrePedidoEspecial>>(`${this.baseUri}/caja/info-cierre`)
      .pipe(map((res) => new InfoCierrePedidoEspecialModel(res?.modelo ?? {})));
  }

  /**
   * Resumen de "Cierre de Caja" del día (ventas por forma de pago, devoluciones,
   * ingresos/retiros de efectivo, abonos), previo a confirmar el cierre. Efecto colateral real
   * del SP reusado: crea/recalcula el cierre pendiente del día si no existe (ver HU).
   */
  obtenerCierreDia(): Observable<CierrePedidoEspecialDetalle[]> {
    return this.http
      .get<Notificacion<CierrePedidoEspecialDetalle[]>>(`${this.baseUri}/caja/cierre-dia`)
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CierrePedidoEspecialDetalleModel(c))));
  }

  /** Valida usuario/contraseña de un autorizador antes del cierre (modal de autorización condicional a `RequiereAutCierre`). */
  validarUsuarioCierre(request: ValidarUsuarioPedidoEspecialRequest): Observable<Notificacion<Sesion>> {
    return this.http.post<Notificacion<Sesion>>(`${this.baseUri}/caja/validar-usuario`, request);
  }

  /** Cierre de la estación de Pedidos Especiales. `usuarioAutoriza`/`contrasena` solo si la configuración lo exige. */
  cerrarCaja(request: CierrePedidoEspecialRequest): Observable<Notificacion<string>> {
    return this.http
      .post<Notificacion<string>>(`${this.baseUri}/caja/cerrar`, request)
      .pipe(tap((res) => res?.estatus === 200 && this.marcarCajaCerrada()));
  }

  /** PDF del comprobante de cierre de caja del día. `idCierre` se relee de {@link obtenerCierreDia} (el SP de cierre no regresa el id). */
  obtenerTicketCierre(idCierre: number): Observable<Blob> {
    return this.http.get(`${this.baseUri}/caja/${idCierre}/ticket`, { responseType: 'blob' });
  }

  // ====================== Cuentas por Cobrar (feature cuentas_por_cobrar_pe) ======================
  //
  // Listado paginado de clientes con adeudo + detalle de pedidos por cliente + registro de
  // abonos + PDFs (desglose de cuenta y ticket de abono). Mismo controller/servicio ya
  // existente (ver notas de tareas), sin duplicar un dominio aparte.

  private readonly cuentasPorCobrarUri = `${this.baseUri}/cuentas-por-cobrar`;

  /** Listado paginado de clientes con adeudo (SP_V2_CONSULTA_CUENTAS_X_COBRAR_PEDIDOS_ESPECIALES). `q` busca por nombre de cliente. */
  listarCuentasPorCobrar(opts: ListarParams = {}): Observable<PagedResult<CuentaPorCobrar>> {
    const params = buildListParams(opts);
    return this.http
      .get<Notificacion<CuentaPorCobrar[]>>(this.cuentasPorCobrarUri, { params })
      .pipe(map((res) => this.mapPageCuentasPorCobrar(res)));
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  irLinkCuentasPorCobrar(url: string): Observable<PagedResult<CuentaPorCobrar>> {
    return this.http
      .get<Notificacion<CuentaPorCobrar[]>>(url)
      .pipe(map((res) => this.mapPageCuentasPorCobrar(res)));
  }

  /**
   * Exporta a CSV el listado con el MISMO criterio `q` que {@link listarCuentasPorCobrar}, sin
   * paginar (P-02 de la auditoría de paridad `cuentas-por-cobrar-pe`: el legado exportaba a
   * Excel vía DataTables Buttons, ausente en la migración inicial). Mismo patrón server-side que
   * `ReportesCierresPEService.exportarCSV`.
   */
  exportarCuentasPorCobrarCSV(q: string): Observable<Blob> {
    const params = buildListParams({ q });
    return this.http.get(`${this.cuentasPorCobrarUri}/exportar`, { params, responseType: 'blob' });
  }

  private mapPageCuentasPorCobrar(res: Notificacion<CuentaPorCobrar[]>): PagedResult<CuentaPorCobrar> {
    return {
      data: (res?.modelo ?? []).map((c) => new CuentaPorCobrarModel(c)),
      links: res?.links ?? EMPTY_LINKS,
      meta: res?.meta ?? EMPTY_META,
    };
  }

  /** Detalle de pedidos con adeudo de un cliente (SP_OBTENER_DETALLE_CUENTAS_X_COBRAR_PEDIDOS_ESPECIALES). No pagina (acotado por cliente). */
  obtenerDetalleCuentaPorCobrar(idCliente: number): Observable<DetalleCuentaPorCobrar[]> {
    return this.http
      .get<Notificacion<DetalleCuentaPorCobrar[]>>(`${this.cuentasPorCobrarUri}/${idCliente}/detalle`)
      .pipe(map((res) => (res?.modelo ?? []).map((d) => new DetalleCuentaPorCobrarModel(d))));
  }

  /** Registra un abono de cliente (SP_REALIZA_ABONO_PEDIDOS_ESPECIALES). `idUsuario` lo toma el back del JWT. */
  realizarAbono(request: RealizarAbonoRequest): Observable<Notificacion<AbonoRealizado>> {
    return this.http.post<Notificacion<AbonoRealizado>>(`${this.cuentasPorCobrarUri}/abonos`, request);
  }

  /** PDF del desglose de cargos/abonos del cliente (A4, réplica de `Utils.GeneraPDFCuentasPorCobrar`). Solo se VE (`abrirPdfBlob`), nunca se manda al print-agent. */
  obtenerPdfCuentaPorCobrar(idCliente: number): Observable<Blob> {
    return this.http.get(`${this.cuentasPorCobrarUri}/${idCliente}/pdf`, { responseType: 'blob' });
  }

  /** PDF del ticket térmico (80mm) de un abono recién registrado — se IMPRIME vía el print-agent. */
  obtenerTicketAbono(idAbonoCliente: number): Observable<Blob> {
    return this.http.get(`${this.cuentasPorCobrarUri}/abonos/${idAbonoCliente}/ticket`, {
      responseType: 'blob',
    });
  }
}
