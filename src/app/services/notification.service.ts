import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

/**
 * Estados de aviso soportados. Mantienen los mismos identificadores que usaba
 * `angular-notifier` (`success` | `error` | `warning` | `info` | `default`) para
 * no tener que tocar los call sites existentes.
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'default';

/**
 * Servicio de notificaciones tipo "toast".
 *
 * **Punto único de abstracción** sobre la librería de toasts: hoy `ngx-toastr`. Si en el
 * futuro se cambia/queda sin soporte, **solo se modifica este archivo** (la firma
 * `notify(type, message)` se conserva y ningún componente la consume directamente).
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toastr = inject(ToastrService);

  /**
   * Muestra un aviso.
   * @param type Estado del aviso (`success` | `error` | `warning` | `info` | `default`).
   * @param message Texto a mostrar.
   */
  notify(type: NotificationType, message: string): void {
    switch (type) {
      case 'success':
        this.toastr.success(message);
        break;
      case 'error':
        this.toastr.error(message);
        break;
      case 'warning':
        this.toastr.warning(message);
        break;
      case 'info':
        this.toastr.info(message);
        break;
      default:
        this.toastr.show(message);
        break;
    }
  }
}
