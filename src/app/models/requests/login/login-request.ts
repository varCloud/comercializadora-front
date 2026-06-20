// Credenciales de login. Replican el contrato de la API (POST /auth/login).
export interface LoginRequest {
  usuario: string;
  contrasena: string;
}

export class LoginRequestModel implements LoginRequest {
  usuario: string;
  contrasena: string;

  constructor(data: LoginRequest) {
    this.usuario = data.usuario;
    this.contrasena = data.contrasena;
  }

  public toPayload(): LoginRequest {
    return {
      usuario: this.usuario,
      contrasena: this.contrasena,
    };
  }
}
