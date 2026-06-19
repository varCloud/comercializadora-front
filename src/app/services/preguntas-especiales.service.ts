import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PreguntaEspecial, PreguntaEspecialModel } from '../models/preguntas-especiales';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from '../config/uris-config';
import { EmpleadosPreguntaModel, SubirEmpleadosPreguntaModel } from '../models/subirEmpleadosPregunta.model';

@Injectable({
  providedIn: 'root'
})
export class PreguntasEspecialesService {
  private apiUrl = `${environment.BASE_URL}/${URIS_CONFIG.PREGUNTAS_ESPECIALES}/`;

  constructor(private http: HttpClient) { }

  // Obtener todas las preguntas especiales
  getPreguntasEspeciales(): Observable<PreguntaEspecialModel[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((data: any) => data.data.map((item: any) => new PreguntaEspecialModel(item)))
    );
  }

  // Eliminar una pregunta especial
  deletePreguntaEspecial(idEvaluacion: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${idEvaluacion}`);
  }

  // Crear una nueva pregunta especial
  crearPreguntaEspecial(preguntaEspecial: SubirEmpleadosPreguntaModel): Observable<any> {
    return this.http.post<PreguntaEspecial>(this.apiUrl, preguntaEspecial).pipe(
      map((data) => new PreguntaEspecialModel(data))
    );
  }

    // Editar una nueva pregunta especial
    sincronizarPreguntaEspecial(preguntaEspecial: SubirEmpleadosPreguntaModel): Observable<any> {
      return this.http.put<PreguntaEspecial>(this.apiUrl, preguntaEspecial).pipe(
        map((data) => new PreguntaEspecialModel(data))
      );
    }

  // Obtener datos de una pregunta especial por ID de evaluación
  getEmpleadosPorIdEvaluacion(idEvaluacion: number): Observable<EmpleadosPreguntaModel[]> {
    return this.http.get<any>(`${this.apiUrl}${idEvaluacion}`).pipe(
      map((data: any) => data.data.map((item: any) => new EmpleadosPreguntaModel(item.usuario)))
    );
  }
}
