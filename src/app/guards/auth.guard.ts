import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {
    const token = localStorage.getItem('token');
    return true;
    if (token) {
      return true;
      // if(this.authService.isAuthorized(state.url)){
      //   return true;
      // }
      // else {
      //   this.router.navigate(['authentication/side-login']);
      //   return false;
      // }
    }
    localStorage.clear();
    this.router.navigate(['login/authentication/side-login']);
    return false;
  }
}
