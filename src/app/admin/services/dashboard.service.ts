import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
import {
  DashboardKpis,
  DashboardKpisModel,
} from 'src/app/admin/models/dashboard/dashboard-kpis';
import {
  VentasPorFecha,
  VentasPorFechaModel,
} from 'src/app/admin/models/dashboard/ventas-por-fecha';
import {
  EstacionVenta,
  EstacionVentaModel,
} from 'src/app/admin/models/dashboard/venta-estacion';
import {
  Categoria,
  CategoriaModel,
} from 'src/app/admin/models/dashboard/categoria';

/**
 * Servicio HTTP del Dashboard. Consume la API nueva (comercializadora-api).
 * Todos los endpoints son GET; el token JWT lo agrega auth.interceptor.ts (regla 02).
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.DASHBOARD}`;

  /** KPIs principales (ventas, información global, merma y costo de producción). */
  obtenerKpis(): Observable<DashboardKpis> {
    return this.http
      .get<Notificacion<DashboardKpis>>(`${this.baseUri}/kpis`)
      .pipe(map((res) => new DashboardKpisModel(res?.modelo ?? {})));
  }

  /**
   * Ventas por fecha para la gráfica de columnas. periodo: 1=Semana, 2=Mes, 3=Año.
   * fechaConsulta (opcional, ISO string) ancla el periodo a una fecha histórica; si se omite,
   * la API usa la fecha actual (útil con respaldos de meses anteriores).
   */
  obtenerVentasPorFecha(periodo: number, fechaConsulta?: string): Observable<VentasPorFecha> {
    let params = new HttpParams().set('periodo', periodo);
    if (fechaConsulta) {
      params = params.set('fechaConsulta', fechaConsulta);
    }
    return this.http
      .get<Notificacion<VentasPorFecha>>(`${this.baseUri}/ventas-por-fecha`, {
        params,
      })
      .pipe(map((res) => new VentasPorFechaModel(res?.modelo ?? {})));
  }

  /**
   * Ventas por estación. Sin rango devuelve los totales globales por estación
   * (día/semana/mes/año); con rango (ISO string) devuelve el total del periodo en montoTotalDia
   * (usado por el drilldown de la gráfica).
   */
  obtenerVentasPorEstacion(
    fechaIni?: string,
    fechaFin?: string,
  ): Observable<EstacionVenta[]> {
    let params = new HttpParams();
    if (fechaIni) {
      params = params.set('fechaIni', fechaIni);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }
    return this.http
      .get<Notificacion<EstacionVenta[]>>(`${this.baseUri}/ventas-por-estacion`, {
        params,
      })
      .pipe(map((res) => (res?.modelo ?? []).map((e) => new EstacionVentaModel(e))));
  }

  /**
   * Top ten. tipo: 2=Productos, 3=Clientes, 4=Proveedores. periodo: 1=Semana, 2=Mes, 3=Año, 4=Día.
   * Devuelve [] si la API responde sin resultados (estatus != 200).
   */
  obtenerTopTen(periodo: number, tipo: number): Observable<Categoria[]> {
    const params = new HttpParams().set('periodo', periodo).set('tipo', tipo);
    return this.http
      .get<Notificacion<Categoria[]>>(`${this.baseUri}/top-ten`, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CategoriaModel(c))));
  }

  /**
   * IVA acumulado de ventas y pedidos especiales, para la gráfica que acompaña a "Ventas por
   * fecha" (mismo periodo: 1=Semana, 2=Mes, 3=Año). Replica al legado
   * (`DashBoardController.CrearDataGraficoIVA` + `graficoIvaAcumulado.js`), que sí renderiza
   * este segundo gráfico — no es código muerto.
   */
  obtenerIvaAcumulado(periodo: number): Observable<Categoria[]> {
    const params = new HttpParams().set('periodo', periodo);
    return this.http
      .get<Notificacion<Categoria[]>>(`${this.baseUri}/iva-acumulado`, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CategoriaModel(c))));
  }
}
