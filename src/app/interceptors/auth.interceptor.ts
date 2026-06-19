import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    // Obtener el token del servicio de autenticación
    const token = localStorage.getItem('token');

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          Campoprueba: 'prueba',
        },
      });
    }

    return next.handle(request).pipe(
      catchError((error) => {
        if (error.status === 401) {
          // Redirigir al usuario a la página de login
          localStorage.removeItem('token');
          this.router.navigate(['/login/authentication/side-login'], {
            replaceUrl: true,
          });
        }
        return throwError(() => error);
      }),
    );
  }
}
