import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { environment } from 'src/environments/environment';
import { LoginRequestModel } from 'src/app/models/requests/login/login-request';
import { Notificacion, Sesion, SesionModel } from 'src/app/models/sesion';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(private _http: HttpClient) {}

  /**
   * Inicia sesión contra la API (POST {BASE_URL_ADMIN}/auth/login).
   * Devuelve la sesión del usuario, que incluye el token JWT.
   */
  public signIn(request: LoginRequestModel): Observable<Sesion> {
    const uri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.SIGN_IN}/login`;

    return this._http
      .post<Notificacion<Sesion>>(uri, request.toPayload())
      .pipe(
        map((response) => {
          if (!response?.modelo) {
            throw new Error(response?.mensaje ?? 'No se pudo iniciar sesión');
          }
          return new SesionModel(response.modelo);
        }),
      );
  }
}
