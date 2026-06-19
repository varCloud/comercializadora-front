import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from '../config/uris-config';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private readonly uri = `${environment.BASE_URL}/${URIS_CONFIG.REPORTES}/`;

  constructor(private http: HttpClient) { }

  getReportes(idEvaluacion: number, idRol: number): Observable<any> {
    let params = new HttpParams().set('idEvaluacion', idEvaluacion.toString());
    if (idRol > 0) {
      params = params.set('idRol', idRol.toString());
    }
    const headers = new HttpHeaders().set('Content-Type', 'text/csv');
    return this.http.get<string>(this.uri, { params, headers, responseType: 'text' as 'json'});
  }
  
  
}
