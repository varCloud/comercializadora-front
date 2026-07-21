import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
import {
  CierrePedidosEspeciales,
  CierrePedidosEspecialesModel,
} from 'src/app/admin/models/reportes-cierres-pe/cierre-pedidos-especiales';
import { CierrePedidosPESearchParams } from 'src/app/admin/models/reportes-cierres-pe/cierre-pedidos-pe-search-params';

/**
 * Servicio HTTP de "Reportes > Cierres de Pedidos Especiales" (FE-2). Migra
 * `ReportesController.ConsultaCierresPedidosEspeciales` del legado
 * (`SP_REPORTE_CIERRES_PEDIDOS_ESPECIALES` tal cual, sin `SP_V2_*`).
 *
 * **Sin paginación server-side** (igual que "Cierres de Caja", hermano de este reporte): el SP
 * devuelve un solo resultset completo (`Notificacion<T[]>` sin `links`/`meta`).
 * `CierrePEListComponent` pagina en el cliente con `paginarCliente` (regla 10, "último
 * recurso"), manteniendo `app-paginador` como footer obligatorio.
 *
 * A diferencia de `ReportesCierresService` (Cierres de Caja), **no** incluye `idAlmacen`: no
 * existe en el legado de Pedidos Especiales (decisión de la HU).
 */
@Injectable({ providedIn: 'root' })
export class ReportesCierresPEService {
  private readonly http = inject(HttpClient);
  private readonly baseUri =
    `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.REPORTES}/${URIS_CONFIG.REPORTE_CIERRES_PE}`;

  /** GET /api/reportes/cierres-pe — listado sin filtros (paridad 1:1 con el legado). */
  getCierres(): Observable<CierrePedidosEspeciales[]> {
    return this.http
      .get<Notificacion<CierrePedidosEspeciales[]>>(this.baseUri)
      .pipe(map((res) => this.mapModelo(res)));
  }

  /** POST /api/reportes/cierres-pe/buscar — idUsuario/fechaIni/fechaFin, AND entre los presentes. */
  searchCierres(filtros: CierrePedidosPESearchParams): Observable<CierrePedidosEspeciales[]> {
    return this.http
      .post<Notificacion<CierrePedidosEspeciales[]>>(`${this.baseUri}/buscar`, filtros)
      .pipe(map((res) => this.mapModelo(res)));
  }

  /**
   * GET /api/reportes/cierres-pe/exportar — descarga CSV con los mismos filtros de
   * `searchCierres`. El nombre del archivo lo genera el back (`Cierres_<fecha>.csv`).
   */
  exportarCSV(filtros: CierrePedidosPESearchParams): Observable<Blob> {
    let params = new HttpParams();
    if (filtros.idUsuario != null) params = params.set('idUsuario', filtros.idUsuario);
    if (filtros.fechaIni) params = params.set('fechaIni', filtros.fechaIni);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);

    return this.http.get(`${this.baseUri}/exportar`, { params, responseType: 'blob' });
  }

  private mapModelo(res: Notificacion<CierrePedidosEspeciales[]>): CierrePedidosEspeciales[] {
    return (res?.modelo ?? []).map((i) => new CierrePedidosEspecialesModel(i));
  }
}
