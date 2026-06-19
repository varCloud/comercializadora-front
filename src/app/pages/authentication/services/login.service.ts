import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { environment } from 'src/environments/environment';
import { UserModel } from 'src/app/models/user';
import { LoginRequestModel } from 'src/app/models/requests/login/login-request';
import { UserTypeEnum } from 'src/app/config/enum';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private _http: HttpClient) {}

  /**
   * Realiza el login del usuario
   * 
   * URL utilizada según el tipo de usuario:
   * - Atletas (UserTypeEnum.ATHLETE = 3): BASE_URL
   * - Administrador (UserTypeEnum.ADMIN = 4): BASE_URL_ADMIN
   * - Otros: BASE_URL
   * 
   * @param request Datos de login con email, password y userType
   * @returns Observable con usuario y token
   */
  public signIn(request : LoginRequestModel): Observable<{user:UserModel , token:string}> {
    debugger
    const baseUrl = this.getBaseUrlByUserType(request.userType);
    const uri = `${baseUrl}/${URIS_CONFIG.SIGN_IN}/login`;
    
    return this._http.post(uri, request.toPayload()).pipe(map((response: any) => {
      return {user: new UserModel(response) ,token: response.token}
    }))
  }

  /**
   * Determina la URL base según el tipo de usuario
   * 
   * @param userType Tipo de usuario (UserTypeEnum)
   * @returns URL base correspondiente (BASE_URL o BASE_URL_ADMIN)
   */
  private getBaseUrlByUserType(userType: number): string {
    // Administrador usa BASE_URL_ADMIN
    if (userType === UserTypeEnum.ADMIN) {
      return environment.BASE_URL_ADMIN;
    }
    // Atletas y otros usuarios usan BASE_URL
    return environment.BASE_URL;
  }
}