// auth.service.ts
import { Injectable } from '@angular/core';
import { navItemsApp } from '../layouts/full/vertical/sidebar/sidebar-evaluaciones-data';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  getRole(): 'admin' | 'evaluador' | null {
    const isAdmin = localStorage.getItem('isAdmin');
    return isAdmin === 'true'
      ? 'admin'
      : isAdmin === 'false'
        ? 'evaluador'
        : null;
  }

  isAuthorized(route: string): boolean {
    const role = this.getRole();
    if (!role) return false;

    const navItemsByRole: { [key: string]: string[] } = {
      admin: navItemsApp
        .filter((item) => item.route)
        .map((item) => item.route!),
      // evaluador: navItemsEvaluacionesEvaluador.filter(item => item.route).map(item => item.route!),
    };

    const allowedRoutes = navItemsByRole[role] || [];
    return allowedRoutes.includes(route);
  }
}
