import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { CommonModule, NgIf } from '@angular/common';
import { LoginService } from '../services/login.service';
import { take } from 'rxjs';
import { UserModel } from 'src/app/models/user';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { BlockComponent } from '../../ui-components/block/block.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NotificationService } from 'src/app/services/notification.service';
import {
  LoginRequest,
  LoginRequestModel,
} from 'src/app/models/requests/login/login-request';
import { UserTypeEnum } from 'src/app/config/enum';

@Component({
    selector: 'app-athlete-login',
    imports: [
        RouterModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        BlockUIModule,
        SweetAlert2Module,
        CommonModule,
    ],
    templateUrl: './athlete-login.component.html'
})
export class AppAthleteLoginComponent {
  options = this.settings.getOptions();
  @BlockUI('login-container') blockUILayout: NgBlockUI;
  public readonly templateBlockModalUiComponent: BlockComponent =
    BlockComponent;

  showPassword: boolean = false;

  /**
   * Constante para validar el rol de atleta
   * Valor: ATHLETE (3) del enum UserTypeEnum
   */
  private readonly ATHLETE_ROLE_ID = UserTypeEnum.ATHLETE;
  private readonly ATHLETE_ROLE_KEYWORDS = ['atleta', 'athlete'];

  constructor(
    private settings: CoreService,
    private router: Router,
    private _loginService: LoginService,
    private notify: NotificationService,
  ) {}

  form = new FormGroup({
    email: new FormControl('sapitopicador@gmail.com', [Validators.required, Validators.email]),
    password: new FormControl('Victor90', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Realiza el login del atleta con validación de rol
   */
  submit() {
    if (this.form.invalid) {
      this.notify.notify('error', 'Por favor completa todos los campos correctamente');
      return;
    }

    this.blockUILayout.start();

    const payLoad: LoginRequestModel = new LoginRequestModel({
      email: this.f['email'].value!,
      password: this.f['password'].value!,
      userType: UserTypeEnum.ATHLETE,
    });
    this._loginService
      .signIn(payLoad)
      .pipe(take(1))
      .subscribe(
        (data: { user: UserModel; token: string }) => {
          // Validar que el usuario sea un atleta
          if (this.isAthlete(data.user)) {
            // Guardar datos en localStorage
            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            
            this.notify.notify('success', `¡Bienvenido ${data.user.nombreS}!`);
            
            // Redirigir al panel de administración
            this.router.navigateByUrl('/admin');
            this.blockUILayout.stop();
          } else {
            // Usuario no es atleta - mostrar error y limpiar
            this.handleInvalidRole(data.user);
            this.blockUILayout.stop();
          }
        },
        (err) => {
          const errorMessage = err.error?.message || 'Error al iniciar sesión. Por favor intenta de nuevo.';
          this.notify.notify('error', errorMessage);
          this.blockUILayout.stop();
        },
      );
  }

  /**
   * Valida si el usuario tiene el rol de atleta
   * @param user Usuario a validar
   * @returns true si el usuario es atleta
   */
  private isAthlete(user: UserModel): boolean {
    debugger
    if (!user || !user.Rol) {
      return false;
    }

    // Validar por ID de rol
    if (user.Rol.idRol === this.ATHLETE_ROLE_ID) {
      return true;
    }

    // Validar por nombre de rol (alternativa si el ID no coincide)
    if (user.Rol.nomRol) {
      const rolName = user.Rol.nomRol.toLowerCase();
      return this.ATHLETE_ROLE_KEYWORDS.some(keyword => rolName.includes(keyword));
    }

    return false;
  }

  /**
   * Maneja cuando el usuario logeado no es atleta
   * @param user Usuario que intentó logearse
   */
  private handleInvalidRole(user: UserModel): void {
    // Limpiar localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    // Mostrar error
    const rolName = user.Rol?.nomRol || 'desconocido';
    this.notify.notify(
      'error',
      `Acceso exclusivo para atletas. Tu rol actual es: ${rolName}. Por favor utiliza el acceso administrativo.`
    );

    // Resetear formulario
    this.form.reset();
  }
}
