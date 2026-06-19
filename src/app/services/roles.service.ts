import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Rol, RolModel } from '../models/roles';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from '../config/uris-config';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
 readonly uri = `${environment.BASE_URL}/${URIS_CONFIG.ROLES}/`;
  constructor(private http: HttpClient) {}

  // Método para obtener todos los roles
  getRoles(): Observable<RolModel[]> {
    return this.http.get<any>(this.uri).pipe
    (map((data:any) => data.data.map((item:any) => new RolModel(item)))
  );
  }

  // Método para obtener un rol por su ID
  getRolById(id: number): Observable<Rol> {
    const url = `${this.uri}/${id}`;
    return this.http.get<Rol>(url);
  }
}
