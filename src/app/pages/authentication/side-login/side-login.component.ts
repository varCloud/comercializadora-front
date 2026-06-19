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
import { NotifierService } from 'angular-notifier';
import {
  LoginRequest,
  LoginRequestModel,
} from 'src/app/models/requests/login/login-request';
import { UserTypeEnum } from 'src/app/config/enum';

@Component({
  selector: 'app-side-login',
  standalone: true,
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
    private notify: NotifierService,
  ) {}

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  submit() {
    this.blockUILayout.start();

    const payLoad: LoginRequestModel = new LoginRequestModel({
      email: this.f.email.value!,
      password: this.f.password.value!,
      userType: UserTypeEnum.ADMIN,
    });

    this._loginService
      .signIn(payLoad)
      .pipe(take(1))
      .subscribe(
        (data: { user: UserModel; token: string }) => {
          localStorage.setItem('user', JSON.stringify(data));
          localStorage.setItem('token', data.token);
          this.router.navigateByUrl('ui-components');
          this.notify.notify('success', 'Bienvenido');
          this.router.navigateByUrl('/');
          this.blockUILayout.stop();
        },
        (err) => {
          this.notify.notify('error', err.error.message);
          this.blockUILayout.stop();
        },
      );
  }
}
