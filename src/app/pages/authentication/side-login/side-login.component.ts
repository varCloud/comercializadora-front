import { Component } from '@angular/core';
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
import { CommonModule } from '@angular/common';
import { LoginService } from '../services/login.service';
import { finalize, take } from 'rxjs';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { BlockComponent } from '../../ui-components/block/block.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NotificationService } from 'src/app/services/notification.service';
import { LoginRequestModel } from 'src/app/models/requests/login/login-request';
import { Sesion } from 'src/app/models/sesion';

@Component({
  selector: 'app-side-login',
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    BlockUIModule,
    SweetAlert2Module,
    CommonModule,
  ],
  templateUrl: './side-login.component.html',
  styleUrl: './side-login.component.scss',
})
export class AppSideLoginComponent {
  options = this.settings.getOptions();
  @BlockUI('login-container') blockUILayout: NgBlockUI;
  public readonly templateBlockModalUiComponent: BlockComponent =
    BlockComponent;
  _isAdmin: boolean = false;

  constructor(
    private settings: CoreService,
    private router: Router,
    private _loginService: LoginService,
    private notify: NotificationService,
  ) {}

  form = new FormGroup({
    usuario: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  submit() {
    this.blockUILayout.start();

    const payLoad: LoginRequestModel = new LoginRequestModel({
      usuario: this.f.usuario.value!,
      contrasena: this.f.password.value!,
    });

    this._loginService
      .signIn(payLoad)
      .pipe(
        take(1),
        finalize(() => this.blockUILayout.stop()),
      )
      .subscribe({
        next: (sesion: Sesion) => {
          localStorage.setItem('token', sesion.token);
          localStorage.setItem('sesion', JSON.stringify(sesion));
          this.notify.notify('success', `Bienvenido ${sesion.nombre ?? ''}`.trim());
          this.router.navigateByUrl('/');
        },
        error: (err) => {
          const mensaje =
            err?.error?.mensaje ?? err?.message ?? 'Usuario o contraseña incorrectos';
          this.notify.notify('error', mensaje);
          console.error('Error en login', err);
        },
      });
  }
}
