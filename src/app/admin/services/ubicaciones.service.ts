import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
import { Catalogo, CatalogoModel } from 'src/app/admin/models/shared/catalogo';
import { UbicacionImprimir } from 'src/app/admin/models/productos/ubicacion-imprimir';

/**
 * Servicio HTTP del generador de etiquetas QR de ubicaciones (módulo Productos).
 * Consume `api/productos/ubicaciones`: catálogos (almacén por sucursal, pisos/pasillos/racks)
 * y la generación del PDF (devuelve el archivo como Blob).
 */
@Injectable({ providedIn: 'root' })
export class UbicacionesService {
  private readonly http = inject(HttpClient);
  private readonly baseUri =
    `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.PRODUCTOS}/${URIS_CONFIG.UBICACIONES}`;

  /** Almacenes de una sucursal (para el combo). */
  obtenerAlmacenes(idSucursal: number): Observable<Catalogo[]> {
    const params = new HttpParams().set('idSucursal', idSucursal);
    return this.http
      .get<Notificacion<Catalogo[]>>(`${this.baseUri}/catalogos/almacenes`, { params })
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CatalogoModel(c))));
  }

  /** Catálogo de pisos. */
  obtenerPisos(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/catalogos/pisos`);
  }

  /** Catálogo de pasillos. */
  obtenerPasillos(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/catalogos/pasillos`);
  }

  /** Catálogo de racks. */
  obtenerRacks(): Observable<Catalogo[]> {
    return this.obtenerCatalogo(`${this.baseUri}/catalogos/racks`);
  }

  /** Genera el PDF de etiquetas QR de las ubicaciones indicadas (un QR por ubicación). */
  imprimir(ubicaciones: UbicacionImprimir[]): Observable<Blob> {
    return this.http.post(`${this.baseUri}/imprimir`, ubicaciones, { responseType: 'blob' });
  }

  private obtenerCatalogo(uri: string): Observable<Catalogo[]> {
    return this.http
      .get<Notificacion<Catalogo[]>>(uri)
      .pipe(map((res) => (res?.modelo ?? []).map((c) => new CatalogoModel(c))));
  }
}
