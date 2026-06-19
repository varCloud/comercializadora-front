import { Injectable, inject } from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

/**
 * Estados de aviso soportados. Mantienen los mismos identificadores que usaba
 * `angular-notifier` (`success` | `error` | `warning` | `info` | `default`) para
 * no tener que tocar los call sites existentes.
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'default';

/**
 * Servicio de notificaciones tipo "toast" basado en `MatSnackBar`.
 *
 * Reemplaza a `angular-notifier` (sin soporte para Angular 20) conservando la
 * firma `notify(type, message)`. El estilo por estado se resuelve con las clases
 * globales `app-snackbar-<estado>` definidas en `assets/scss/style.scss`.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  /** Duración por defecto (ms); equivale al `autoHide` previo de angular-notifier. */
  private readonly defaultDuration = 4000;
  private readonly horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  private readonly verticalPosition: MatSnackBarVerticalPosition = 'bottom';

  /**
   * Muestra un aviso.
   * @param type Estado del aviso (`success` | `error` | `warning` | `info` | `default`).
   * @param message Texto a mostrar.
   */
  notify(type: NotificationType, message: string): void {
    const config: MatSnackBarConfig = {
      duration: this.defaultDuration,
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
      panelClass: ['app-snackbar', `app-snackbar-${type}`],
    };
    this.snackBar.open(message, 'Cerrar', config);
  }
}
