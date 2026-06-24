import { Injectable, computed, signal } from '@angular/core';
import { Permiso, Sesion, SesionModel } from '../models/sesion';

/**
 * Maneja la sesión del usuario autenticado de forma centralizada y reactiva.
 * Persiste en localStorage y expone el estado como signals para que cualquier
 * componente (header, guards, menús) lo consuma. Pensado para crecer: permisos,
 * rol, datos de empresa, etc.
 */
@Injectable({
  providedIn: 'root',
})
export class SesionService {
  private static readonly TOKEN_KEY = 'token';
  private static readonly SESION_KEY = 'sesion';

  private readonly _sesion = signal<Sesion | null>(this.leerSesionGuardada());

  /** Sesión actual (solo lectura). */
  readonly sesion = this._sesion.asReadonly();

  /** Nombre del usuario (vacío si no hay sesión). */
  readonly nombre = computed(() => this._sesion()?.nombre?.trim() ?? '');
  readonly usuario = computed(() => this._sesion()?.usuario ?? '');
  readonly rol = computed(() => this._sesion()?.rol ?? '');
  readonly permisos = computed<Permiso[]>(() => this._sesion()?.permisosModulo ?? []);

  /** True si hay un token en la sesión. */
  readonly estaAutenticado = computed(() => !!this._sesion()?.token);

  /** Token JWT actual (de la sesión o, como respaldo, de localStorage). */
  get token(): string | null {
    return this._sesion()?.token ?? localStorage.getItem(SesionService.TOKEN_KEY);
  }

  /** Guarda la sesión (tras el login) en memoria y localStorage. */
  setSesion(sesion: Sesion): void {
    const modelo = new SesionModel(sesion);
    localStorage.setItem(SesionService.TOKEN_KEY, modelo.token);
    localStorage.setItem(SesionService.SESION_KEY, JSON.stringify(modelo));
    this._sesion.set(modelo);
  }

  /** Limpia la sesión (logout o token inválido). */
  limpiar(): void {
    localStorage.removeItem(SesionService.TOKEN_KEY);
    localStorage.removeItem(SesionService.SESION_KEY);
    this._sesion.set(null);
  }

  /** Indica si el usuario tiene un permiso de módulo concreto. */
  tienePermiso(idPermiso: number): boolean {
    return this.permisos().some((p) => p.idPermiso === idPermiso && p.tienePermiso);
  }

  private leerSesionGuardada(): Sesion | null {
    const raw = localStorage.getItem(SesionService.SESION_KEY);
    if (!raw) return null;
    try {
      return new SesionModel(JSON.parse(raw));
    } catch {
      return null;
    }
  }
}
