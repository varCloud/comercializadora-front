import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { TemplateEvaluacionClass } from 'src/app/models/evaluacion';
import { environment } from 'src/environments/environment';
import { evaluacionMock } from '../pages/answer-evaluacion/view-answer-evaluacion/mocks/evaluacion';

@Injectable({
  providedIn: 'root'
})
export class AnswerEvaluacionService {
  readonly uri = `${environment.BASE_URL}/${URIS_CONFIG.EVALUACION_ROL_TEMPLATE}/`;
  readonly uriRespuesta = `${environment.BASE_URL}/${URIS_CONFIG.RESPUESTAS}/`
  constructor(private http: HttpClient) { }

  getEvaluacionToAnswer(idEvaluacion: number, numUsuarioEvaluado: number): Observable<TemplateEvaluacionClass> {
    return this.http.get<any>(`${this.uri}${idEvaluacion}/${numUsuarioEvaluado}`).pipe(
      map(response => new TemplateEvaluacionClass(response.data))
    );
  }

  setEvaluacionContestada(data: any, idEvaluacion: number, numUsuarioEvaluado: number, accionEvaluation:string): Observable<any> {
    return this.http.post<any>(`${this.uriRespuesta}${idEvaluacion}/${numUsuarioEvaluado}?accion=${accionEvaluation}`, data).pipe(
      map(response => response)
    );
  }

  getReport(idEvaluacion: number, numUsuarioEvaluado: number, view:string = 'pdf'): Observable<any> {
    return this.http.get<any>(`${this.uri}${idEvaluacion}/${numUsuarioEvaluado}/report?view=${view}`).pipe(
      map(response => response)
    );  
  }
}