import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
import { Cierre, CierreModel } from 'src/app/admin/models/reportes-cierres/cierre';
import { CierreSearchParams } from 'src/app/admin/models/reportes-cierres/cierre-search-params';

/**
 * Servicio HTTP de "Reportes > Cierres de Caja". Migra `ReportesController.Cierres/
 * BuscarCierres` del legado (`SP_CONSULTA_CIERRES_DIA` tal cual, sin `SP_V2_*`).
 *
 * **Sin paginación server-side** (a diferencia de Ventas/Merma/Devolución/Inventario): el back
 * (`ReportesCierresController`) documenta explícitamente que nace sin paginar (HU la deja
 * condicionada a volumen) y el SP no implementa `OFFSET/FETCH`. Ambos endpoints devuelven el
 * arreglo completo (`Notificacion<T[]>` sin `links`/`meta`). `CierreListComponent` pagina en
 * el cliente con `paginarCliente` (regla 10: "último recurso"), manteniendo `app-paginador`
 * como footer obligatorio.
 *
 * `getCierres()` reproduce el listado sin filtros del legado (paridad con
 * `ReportesController.Cierres()`); el componente usa `searchCierres()` para la carga inicial y
 * cada búsqueda, porque el rango de fechas por defecto (hoy/hoy, regla 18) ya es un filtro.
 */
@Injectable({ providedIn: 'root' })
export class ReportesCierresService {
  private readonly http = inject(HttpClient);
  private readonly baseUri =
    `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.REPORTES}/${URIS_CONFIG.REPORTE_CIERRES}`;

  /** GET /api/reportes/cierres — listado sin filtros (paridad 1:1 con el legado). */
  getCierres(): Observable<Cierre[]> {
    return this.http
      .get<Notificacion<Cierre[]>>(this.baseUri)
      .pipe(map((res) => this.mapModelo(res)));
  }

  /** POST /api/reportes/cierres/buscar — idAlmacen/idUsuario/fechaIni/fechaFin, AND entre los presentes. */
  searchCierres(filtros: CierreSearchParams): Observable<Cierre[]> {
    return this.http
      .post<Notificacion<Cierre[]>>(`${this.baseUri}/buscar`, filtros)
      .pipe(map((res) => this.mapModelo(res)));
  }

  private mapModelo(res: Notificacion<Cierre[]>): Cierre[] {
    return (res?.modelo ?? []).map((i) => new CierreModel(i));
  }
}
