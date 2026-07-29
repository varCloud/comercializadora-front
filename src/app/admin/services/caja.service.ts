import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { Notificacion } from 'src/app/models/sesion';
import { CajaInfo, CajaInfoModel } from 'src/app/admin/models/ventas/caja-info';
import { ValidaApertura, ValidaAperturaModel } from 'src/app/admin/models/ventas/valida-apertura';
import { Retiro, RetiroModel } from 'src/app/admin/models/ventas/retiro';
import { ExcesoEfectivo, ExcesoEfectivoModel } from 'src/app/admin/models/ventas/exceso-efectivo';
import { IngresoEfectivoRequest } from 'src/app/admin/models/ventas/ingreso-efectivo-request';
import { TipoIngresoEfectivoId } from 'src/app/admin/models/ventas/tipo-ingreso-efectivo';
import { RetiroRequest } from 'src/app/admin/models/ventas/retiro-request';
import { CierreRequest } from 'src/app/admin/models/ventas/cierre-request';
import {
  ActualizarEstatusRetiroRequest,
} from 'src/app/admin/models/ventas/actualizar-estatus-retiro-request';
import { ESTATUS_RETIRO } from 'src/app/admin/models/ventas/estatus-retiro';
import { TipoRetiroId } from 'src/app/admin/models/ventas/tipo-retiro';

const MOCK_LATENCY_MS = 350;

/**
 * Servicio HTTP de Caja / Retiros / Ingresos de efectivo (Bloque B de la feature `ventas`).
 *
 * ⚠️ **SIMULADO (FE-B3/FE-B4).** El backend (`API-B4`, `CajaController`) se está construyendo en
 * paralelo — este servicio NO hace ninguna llamada HTTP real todavía. Cada método imita la
 * respuesta esperada (`Notificacion<T>`, delay de red) contra el contrato documentado en
 * `task_ventas.md` (Bloque B):
 *
 * - `GET /api/caja/valida-apertura`      → {@link validaApertura}
 * - `POST /api/caja/apertura`            → {@link abrirCaja}
 * - `GET /api/caja/info-cierre`          → {@link obtenerInfoCierre}
 * - `POST /api/caja/cierre`              → {@link cerrarCaja}
 * - `POST /api/caja/retiro`              → {@link registrarRetiro}
 * - `POST /api/caja/ingreso`             → {@link registrarIngreso}
 * - `GET /api/caja/retiros`              → {@link obtenerRetiros}
 * - `GET /api/caja/retiros/autorizacion` → {@link obtenerRetiros} (mismo listado; el filtro por
 *   rol lo aplica el backend, ver nota de {@link obtenerRetiros})
 * - `PATCH /api/caja/retiros/{id}/estatus` → {@link actualizarEstatusRetiro}
 * - `GET /api/caja/exceso-efectivo`      → {@link obtenerExcesoEfectivo}
 *
 * **FE-B5 (integración real) debe:**
 * 1. Inyectar `HttpClient` y construir `baseUri` con `environment.BASE_URL_ADMIN` +
 *    `URIS_CONFIG.CAJA` (ya agregado a `uris-config.ts`), igual que `VentasService`.
 * 2. Reemplazar el cuerpo de cada método por la llamada HTTP real, conservando la firma pública
 *    (los componentes de FE-B3/FE-B4 ya consumen estos métodos; no deberían necesitar cambios).
 * 3. Verificar los nombres de campo de `CierreRequest`/`CajaInfo`/`ValidaApertura` contra el
 *    contrato real (son una interpretación razonable del boceto, no una respuesta verificada).
 */
@Injectable({ providedIn: 'root' })
export class CajaService {
  /** Estado en memoria del mock, para que las pantallas reaccionen a las acciones del usuario. */
  private cajaAbierta = false;
  private retirosMock: Retiro[] = crearRetirosMock();
  private excesoEfectivoMock: ExcesoEfectivo[] = crearExcesoEfectivoMock();
  private consecutivoRetiro = 1000;

  /** Valida si la estación en sesión ya tiene una caja abierta hoy. */
  validaApertura(): Observable<ValidaApertura> {
    return of(
      new ValidaAperturaModel({
        tieneCajaAbierta: this.cajaAbierta,
        idCierre: this.cajaAbierta ? 1 : null,
        requiereAutorizacionCierre: true,
        mensaje: this.cajaAbierta
          ? 'Ya tiene una caja abierta para esta estación.'
          : 'No tiene una caja abierta. Debe abrir caja para poder vender.',
      }),
    ).pipe(delay(MOCK_LATENCY_MS));
  }

  /** Registra la apertura de caja (viaja como Ingreso de Efectivo tipo "Apertura de Caja"). */
  abrirCaja(request: IngresoEfectivoRequest): Observable<Notificacion<null>> {
    this.cajaAbierta = true;
    return of({
      estatus: 200,
      mensaje: `Caja abierta correctamente con $${request.monto.toFixed(2)}.`,
      modelo: null,
    } as Notificacion<null>).pipe(delay(MOCK_LATENCY_MS));
  }

  /** Resumen de cierre del día (ventas por forma de pago, cancelaciones, devoluciones, retiros, saldo). */
  obtenerInfoCierre(): Observable<CajaInfo> {
    const retirosDia = this.retirosMock
      .filter((r) => r.tipoRetiro === TipoRetiroId.ExcesoEfectivo)
      .reduce((acc, r) => acc + r.montoRetiro, 0);

    return of(
      new CajaInfoModel({
        idCierre: 1,
        idEstacion: 1,
        nombreEstacion: 'Caja 1',
        idUsuario: 1,
        nombreUsuario: 'Cajero de prueba',
        totalVentas: 42,
        montoVentasDelDia: 8450.5,
        montoVentasContado: 5200.0,
        montoVentasTarjeta: 2650.5,
        montoVentasTransferencias: 600.0,
        montoVentasOtros: 0,
        montoVentasCanceladas: 350.0,
        montoApertura: 500.0,
        montoIngresosEfectivo: 200.0,
        retirosHechosDia: retirosDia,
        retirosExcesoEfectivo: retirosDia,
        productosDevueltos: 3,
        montoTotalDevoluciones: 180.0,
        montoCierre: 500.0 + 8450.5 + 200.0 - retirosDia - 180.0,
        efectivoDisponible: 5200.0 + 500.0 + 200.0 - retirosDia,
        efectivoEntregadoEnCierre: 0,
      }),
    ).pipe(delay(MOCK_LATENCY_MS));
  }

  /** Realiza el cierre de caja (con autorización usuario/contraseña incluida si aplica). */
  cerrarCaja(request: CierreRequest): Observable<Notificacion<null>> {
    this.cajaAbierta = false;
    this.retirosMock = [
      this.nuevoRetiroMock(request.efectivoEntregadoEnCierre, TipoRetiroId.CierreDia),
      ...this.retirosMock,
    ];
    return of({
      estatus: 200,
      mensaje: 'Cierre de caja realizado correctamente.',
      modelo: null,
    } as Notificacion<null>).pipe(delay(MOCK_LATENCY_MS));
  }

  /** Retiro por exceso de efectivo (valida el tope disponible; la validación real es server-side). */
  registrarRetiro(request: RetiroRequest): Observable<Notificacion<null>> {
    this.retirosMock = [
      this.nuevoRetiroMock(request.monto, TipoRetiroId.ExcesoEfectivo),
      ...this.retirosMock,
    ];
    return of({
      estatus: 200,
      mensaje: 'Retiro registrado correctamente, pendiente de autorización.',
      modelo: null,
    } as Notificacion<null>).pipe(delay(MOCK_LATENCY_MS));
  }

  /** Ingreso de efectivo libre durante el turno. */
  registrarIngreso(request: IngresoEfectivoRequest): Observable<Notificacion<null>> {
    if (request.idTipoIngresoEfectivo === TipoIngresoEfectivoId.AperturaCajas) {
      return this.abrirCaja(request);
    }
    return of({
      estatus: 200,
      mensaje: `Ingreso de efectivo registrado por $${request.monto.toFixed(2)}.`,
      modelo: null,
    } as Notificacion<null>).pipe(delay(MOCK_LATENCY_MS));
  }

  /**
   * Listado de retiros. Réplica de `_ObtenerRetirosAutorizacion.cshtml`: incluye tipo, monto,
   * usuario, estación, estatus y (si aplica) usuario que autorizó.
   *
   * NOTA de rol: el legado tiene 3 variantes server-rendered (`_ObtenerRetiros`,
   * `_ObtenerRetirosV2`, `_ObtenerRetirosAutorizacion`) con distinta visibilidad según
   * `idRol` (1/2 = Admin/Encargado ven acciones de aprobar/rechazar). Aquí se expone un único
   * listado — el **backend real (API-B4) decide qué filas/columnas devolver según el rol** del
   * JWT; esta pantalla solo pinta lo que reciba (no filtra por rol en el cliente).
   */
  obtenerRetiros(): Observable<Retiro[]> {
    return of([...this.retirosMock]).pipe(delay(MOCK_LATENCY_MS));
  }

  /** Aprueba (`ESTATUS_RETIRO.AUTORIZADO`) o rechaza (`ESTATUS_RETIRO.CANCELADO`) un retiro. */
  actualizarEstatusRetiro(
    idRetiro: number,
    request: ActualizarEstatusRetiroRequest,
  ): Observable<Notificacion<null>> {
    this.retirosMock = this.retirosMock.map((r) =>
      r.idRetiro === idRetiro
        ? new RetiroModel({
            ...r,
            estatusRetiro: {
              idStatus: request.idEstatus,
              descripcion:
                request.idEstatus === ESTATUS_RETIRO.AUTORIZADO ? 'Autorizado' : 'Cancelado',
            },
            montoAutorizado: request.montoAutorizado ?? r.montoRetiro,
            idUsuarioAut: 1,
            nombreUsuarioAut: 'Supervisor de prueba',
          })
        : r,
    );
    return of({
      estatus: 200,
      mensaje:
        request.idEstatus === ESTATUS_RETIRO.AUTORIZADO
          ? 'Retiro autorizado correctamente.'
          : 'Retiro cancelado correctamente.',
      modelo: null,
    } as Notificacion<null>).pipe(delay(MOCK_LATENCY_MS));
  }

  /** Usuarios/estaciones con exceso de efectivo pendiente de retirar (badge global). */
  obtenerExcesoEfectivo(): Observable<ExcesoEfectivo[]> {
    return of([...this.excesoEfectivoMock]).pipe(delay(MOCK_LATENCY_MS));
  }

  private nuevoRetiroMock(monto: number, tipo: TipoRetiroId): Retiro {
    this.consecutivoRetiro += 1;
    return new RetiroModel({
      idRetiro: this.consecutivoRetiro,
      idCierre: 1,
      montoRetiro: monto,
      idUsuario: 1,
      nombreUsuario: 'Cajero de prueba',
      idEstacion: 1,
      nombreEstacion: 'Caja 1',
      idAlmacen: 4,
      fechaAlta: new Date().toISOString(),
      montoAutorizado: 0,
      idUsuarioAut: 0,
      nombreUsuarioAut: '',
      tipoRetiro: tipo,
      estatusRetiro: { idStatus: ESTATUS_RETIRO.PENDIENTE, descripcion: 'Pendiente' },
    });
  }
}

function crearRetirosMock(): Retiro[] {
  return [
    new RetiroModel({
      idRetiro: 101,
      idCierre: 1,
      montoRetiro: 300,
      idUsuario: 2,
      nombreUsuario: 'María López',
      idEstacion: 1,
      nombreEstacion: 'Caja 1',
      idAlmacen: 4,
      fechaAlta: new Date(Date.now() - 3 * 3600_000).toISOString(),
      montoAutorizado: 0,
      idUsuarioAut: 0,
      nombreUsuarioAut: '',
      tipoRetiro: TipoRetiroId.ExcesoEfectivo,
      estatusRetiro: { idStatus: ESTATUS_RETIRO.PENDIENTE, descripcion: 'Pendiente' },
    }),
    new RetiroModel({
      idRetiro: 100,
      idCierre: 1,
      montoRetiro: 500,
      idUsuario: 3,
      nombreUsuario: 'Juan Pérez',
      idEstacion: 2,
      nombreEstacion: 'Caja 2',
      idAlmacen: 4,
      fechaAlta: new Date(Date.now() - 26 * 3600_000).toISOString(),
      montoAutorizado: 500,
      idUsuarioAut: 1,
      nombreUsuarioAut: 'Supervisor de prueba',
      tipoRetiro: TipoRetiroId.CierreDia,
      estatusRetiro: { idStatus: ESTATUS_RETIRO.AUTORIZADO, descripcion: 'Autorizado' },
    }),
    new RetiroModel({
      idRetiro: 99,
      idCierre: 1,
      montoRetiro: 150,
      idUsuario: 2,
      nombreUsuario: 'María López',
      idEstacion: 1,
      nombreEstacion: 'Caja 1',
      idAlmacen: 4,
      fechaAlta: new Date(Date.now() - 30 * 3600_000).toISOString(),
      montoAutorizado: 0,
      idUsuarioAut: 1,
      nombreUsuarioAut: 'Supervisor de prueba',
      tipoRetiro: TipoRetiroId.ExcesoEfectivo,
      estatusRetiro: { idStatus: ESTATUS_RETIRO.CANCELADO, descripcion: 'Cancelado' },
    }),
  ];
}

function crearExcesoEfectivoMock(): ExcesoEfectivo[] {
  return [
    new ExcesoEfectivoModel({
      idUsuario: 2,
      nombre: 'María López — Caja 1',
      ingresos: 5200,
      retiros: 300,
      efectivoDisponible: 4900,
    }),
  ];
}
