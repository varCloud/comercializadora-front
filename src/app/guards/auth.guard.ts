import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');

    if (token && this.isTokenValid(token)) {
      return true;
    }

    // Sin token o token expirado/corrupto: limpiar y mandar al login.
    localStorage.removeItem('token');
    localStorage.removeItem('sesion');
    this.router.navigate(['login/authentication/side-login'], { replaceUrl: true });
    return false;
  }

  /** Valida que el JWT no haya expirado (claim `exp`, en segundos UTC). */
  private isTokenValid(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      if (!payload) return false;
      const decoded = JSON.parse(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
      );
      if (!decoded?.exp) return true; // sin exp: se asume válido
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}
