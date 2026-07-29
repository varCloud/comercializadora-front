import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
import { CajaInfo, CajaInfoModel } from 'src/app/admin/models/ventas/caja-info';
import { ValidaApertura, ValidaAperturaModel } from 'src/app/admin/models/ventas/valida-apertura';
import { Retiro, RetiroModel } from 'src/app/admin/models/ventas/retiro';
import { ExcesoEfectivo, ExcesoEfectivoModel } from 'src/app/admin/models/ventas/exceso-efectivo';
import { IngresoEfectivoRequest } from 'src/app/admin/models/ventas/ingreso-efectivo-request';
import { RetiroRequest } from 'src/app/admin/models/ventas/retiro-request';
import { CierreRequest } from 'src/app/admin/models/ventas/cierre-request';
import { ActualizarEstatusRetiroRequest } from 'src/app/admin/models/ventas/actualizar-estatus-retiro-request';
import { RetirosFiltro, buildRetirosFiltroParams } from 'src/app/admin/models/ventas/retiros-filtro';

/** Tipos de ticket PDF que expone `GET /caja/{id}/ticket-pdf` (API-D2, Bloque D). */
export type TicketCajaTipo = 'ingreso' | 'retiro' | 'cierre';

/**
 * Servicio HTTP de Caja / Retiros / Ingresos de efectivo (Bloque B de la feature `ventas`).
 * Consume `CajaController` (comercializadora-api). idUsuario/idEstacion/idAlmacen NUNCA se
 * mandan desde aquí: los resuelve el backend a partir del JWT, igual que `VentasService`.
 *
 * FE-B5 (integración real): reemplaza el mock de FE-B3/FE-B4. El contrato real difiere del
 * boceto original en varios puntos — documentados método a método abajo y en
 * `.claude/memory/modulo-ventas-bloque-b-fe.md`. Resumen de los más relevantes:
 * - `validaApertura`/`cerrarCaja` regresan `Notificacion<int>` puro (sin el objeto rico que
 *   asumía el mock); no existe endpoint que exponga `requiereAutorizacionCierre`.
 * - `obtenerRetiros`/`obtenerRetirosAutorizacion` NO paginan ni aceptan búsqueda de texto libre
 *   (solo filtros estructurados) — la paginación/búsqueda del listado siguen siendo
 *   client-side (último recurso de la regla 10, ver el componente).
 */
@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.CAJA}`;

  /**
   * Valida si la estación en sesión ya tiene una caja abierta hoy (`SP_VALIDA_APERTURA_CAJAS`).
   * El endpoint real regresa `Notificacion<int>`: `estatus === 200` = ya hay caja abierta.
   */
  validaApertura(): Observable<ValidaApertura> {
    return this.http.get<Notificacion<number>>(`${this.baseUri}/valida-apertura`).pipe(
      map(
        (res) =>
          new ValidaAperturaModel({
            tieneCajaAbierta: res?.estatus === 200,
            mensaje: res?.mensaje ?? null,
          }),
      ),
    );
  }

  /**
   * Registra la apertura de caja. El contrato real (`CajaAperturaRequest`) solo tiene `monto`
   * (el backend fija el tipo "Apertura de Caja" internamente); se conserva la firma con
   * `IngresoEfectivoRequest` para no tocar `AperturaCajaComponent`, y solo se manda `monto`.
   */
  abrirCaja(request: IngresoEfectivoRequest): Observable<Notificacion<number>> {
    return this.http.post<Notificacion<number>>(`${this.baseUri}/apertura`, {
      monto: request.monto,
    });
  }

  /** Resumen de cierre del día (ventas por forma de pago, cancelaciones, devoluciones, retiros, saldo). */
  obtenerInfoCierre(): Observable<CajaInfo> {
    return this.http
      .get<Notificacion<CajaInfo>>(`${this.baseUri}/info-cierre`)
      .pipe(map((res) => new CajaInfoModel(res?.modelo ?? {})));
  }

  /**
   * Realiza el cierre de caja. `monto` siempre viaja en `0` (réplica exacta del legado,
   * `HacerCierre()` en `EvtVentas.js`: solo `efectivoEntregadoEnCierre` importa para el cierre).
   */
  cerrarCaja(request: CierreRequest): Observable<Notificacion<number>> {
    return this.http.post<Notificacion<number>>(`${this.baseUri}/cierre`, {
      monto: 0,
      efectivoEntregadoEnCierre: request.efectivoEntregadoEnCierre,
      usuarioAutoriza: request.usuarioAutoriza,
      contrasena: request.contrasena,
    });
  }

  /** Retiro por exceso de efectivo (el backend valida el tope contra `efectivoDisponible`). */
  registrarRetiro(request: RetiroRequest): Observable<Notificacion<number>> {
    return this.http.post<Notificacion<number>>(`${this.baseUri}/retiro`, {
      monto: request.monto,
    });
  }

  /** Ingreso de efectivo libre durante el turno (tipo "Solicitud de efectivo" fijo en backend). */
  registrarIngreso(request: IngresoEfectivoRequest): Observable<Notificacion<number>> {
    return this.http.post<Notificacion<number>>(`${this.baseUri}/ingreso`, {
      monto: request.monto,
    });
  }

  /**
   * Listado de retiros con filtro por rol server-side (Admin/Encargado ven todo dentro de su
   * estación/almacén; cualquier otro rol solo ve lo propio — ver `CajaController.Retiros`).
   * NO pagina (regresa la lista completa); la paginación queda client-side (ver componente).
   */
  obtenerRetiros(filtro: RetirosFiltro = {}): Observable<Retiro[]> {
    return this.consultarRetiros(`${this.baseUri}/retiros`, filtro);
  }

  /**
   * Listado de retiros para la vista de autorización (Admin/Encargado): réplica de
   * `_ObtenerRetirosAutorizacion.cshtml` del legado, **sin** filtro de rol/estación/almacén — ve
   * todos los retiros pendientes de cualquier usuario/estación.
   */
  obtenerRetirosAutorizacion(filtro: RetirosFiltro = {}): Observable<Retiro[]> {
    return this.consultarRetiros(`${this.baseUri}/retiros/autorizacion`, filtro);
  }

  private consultarRetiros(uri: string, filtro: RetirosFiltro): Observable<Retiro[]> {
    const params = buildRetirosFiltroParams(filtro);
    return this.http
      .get<Notificacion<Retiro[]>>(uri, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((r) => new RetiroModel(r))));
  }

  /** Aprueba (`ESTATUS_RETIRO.AUTORIZADO`) o rechaza (`ESTATUS_RETIRO.CANCELADO`) un retiro. */
  actualizarEstatusRetiro(
    idRetiro: number,
    request: ActualizarEstatusRetiroRequest,
  ): Observable<Notificacion<string>> {
    return this.http.patch<Notificacion<string>>(`${this.baseUri}/retiros/${idRetiro}/estatus`, request);
  }

  /**
   * Usuarios con exceso de efectivo disponible hoy (badge de notificación). Sin `idUsuario` =
   * todos los usuarios (uso del badge global, `ExcesoEfectivoBadgeComponent`).
   */
  obtenerExcesoEfectivo(idUsuario?: number): Observable<ExcesoEfectivo[]> {
    const params = idUsuario ? new HttpParams().set('idUsuario', idUsuario) : undefined;
    return this.http
      .get<Notificacion<ExcesoEfectivo[]>>(`${this.baseUri}/exceso-efectivo`, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((e) => new ExcesoEfectivoModel(e))));
  }

  /** PDF del ticket de un movimiento de caja (ingreso/retiro/cierre) — API-D2, Bloque D. */
  obtenerTicketPdf(id: number, tipo: TicketCajaTipo): Observable<Blob> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get(`${this.baseUri}/${id}/ticket-pdf`, { params, responseType: 'blob' });
  }
}
