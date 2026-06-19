import { AnimationStyleMetadata } from '@angular/animations';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { seccionModel } from 'src/app/models/evaluacion';
import { EvaluacionAsignacionModel } from 'src/app/models/evaluaciones-asignacion';
import { UserModel } from 'src/app/models/user';
import { environment } from 'src/environments/environment';
import { EvaluacionesContestadasListModelModel } from '../models/evaluaciones-contestadas-list.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluacionesAsignadasService {
  readonly uriClave = `${environment.BASE_URL}/${URIS_CONFIG.CLAVES}/`;
  readonly uriEvaluacionesAsignadas = `${environment.BASE_URL}/${URIS_CONFIG.EVALUACIONES_ASIGNADAS}/`;

  constructor(private http: HttpClient) { }

  getEvaluacionAsignadasByNumUsuario(numUsuario: number): Observable<EvaluacionAsignacionModel[]> {
    return this.http.get<any>(`${this.uriEvaluacionesAsignadas}/${numUsuario}`).pipe(
      map(response => response.data.map((s:any) => new EvaluacionAsignacionModel(s)))
    );
  }

  getEvaluaciones(params:any = {}): Observable<EvaluacionesContestadasListModelModel[]> {
    return this.http.get<any>(`${this.uriEvaluacionesAsignadas}`, { 
        params: new HttpParams({ fromObject: params }) 
    }).pipe(
      map(response => response.data.map((s:any) => new EvaluacionesContestadasListModelModel(s)))
    );
  }

  updateEvaluacionAsignacion(idEvaluacionAsignacion:any, params:any): Observable<EvaluacionesContestadasListModelModel[]> {
    return this.http.patch<any>(`${this.uriEvaluacionesAsignadas}${idEvaluacionAsignacion}/`, { 
      ...params
    });
  }
}
