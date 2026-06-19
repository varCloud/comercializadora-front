import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from '../config/uris-config';
import { map, Observable, of } from 'rxjs';
import { Claves, ClavesModel } from '../models/claves';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UserModel } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class ClavesService {

  readonly uri = `${environment.BASE_URL}/${URIS_CONFIG.CLAVES}/`;
  private _claves: Array<Claves> = []
  constructor(private http: HttpClient) { }

  // Obtener lista de claves desde la API
  getClaves(uri: any = null, params: any = {}): Observable<Claves[]> {
    uri = uri ? uri : this.uri;
    return this.http.get<any>(uri, { params: new HttpParams({ fromObject: params }) }).pipe(
      map(
        (response: any) => {
          this._claves = response.data.map((item: any) => new ClavesModel(item))
          return this._claves
        })
    );
  }
  getClavesFromCache(): Array<Claves> {
    return this._claves;
  }

  updateClave(clave: Claves): Observable<any> {
    return this.http.patch<any>(`${this.uri}${clave.numUsuario}`, { autorizo: clave.autorizo });
  }


  getEmpleadosByNumUsuario(numUsuarioJefe: number): Observable<UserModel[]> {
    return this.http.get<any>(`${this.uri}empleados/${numUsuarioJefe}`).pipe(
      map(response => response.data.map((s: any) => new UserModel(s)))
    );
  }

  getUsuario(numUsuaro: number) {
    return this.http.get<any>(`${this.uri}${numUsuaro}`).pipe(
      map(response => new UserModel(response.data))
    );
  }
}
