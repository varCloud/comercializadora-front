import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { CajaService } from 'src/app/admin/services/caja.service';

/**
 * Impide entrar a la pantalla principal de Ventas (POS, `admin/ventas`) sin una caja abierta
 * para la estación en sesión — validación de entrada al POS descrita en la HU de `ventas`
 * (FE-B5). Consulta `CajaService.validaApertura()` (`GET /api/caja/valida-apertura`) y, si
 * `tieneCajaAbierta` es falso, redirige a `admin/ventas/apertura-caja`.
 *
 * Mismo patrón que `AuthGuard` (clase + `CanActivate`, no funcional): ver `auth.guard.ts` en
 * esta misma carpeta. Se aplica SOLO a la ruta raíz de Ventas en `ventas-routing.module.ts`, no
 * a `apertura-caja`/`cierre-caja`/`retiros-ingresos`, para no crear un loop de redirección.
 *
 * Si la validación falla (error de red), se permite la navegación (no se bloquea al usuario por
 * un error transitorio); el POS o el resto del flujo de ventas reportará el error si persiste.
 */
@Injectable({ providedIn: 'root' })
export class CajaAbiertaGuard implements CanActivate {
  private readonly cajaService = inject(CajaService);
  private readonly router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this.cajaService.validaApertura().pipe(
      map((res) =>
        res.tieneCajaAbierta ? true : this.router.createUrlTree(['/admin/ventas/apertura-caja']),
      ),
      catchError((err) => {
        console.error('Error al validar la apertura de caja', err);
        return of(true);
      }),
    );
  }
}
