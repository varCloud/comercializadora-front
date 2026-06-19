 export interface LoginRequest {
  email: string;
  password: string;
  userType: number;
 }

    export class LoginRequestModel implements LoginRequest {
    email: string;
    password: string;
    userType: number;
    constructor(data: LoginRequest) {
        this.email = data.email;
        this.password = data.password;
        this.userType = data.userType;
    }

    public toPayload(): LoginRequest {
        return {
            email: this.email,
            password: this.password,
            userType: this.userType
        };
    }
}