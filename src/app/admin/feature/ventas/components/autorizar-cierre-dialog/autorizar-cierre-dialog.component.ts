import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';

/** Datos capturados en el modal: se envían junto al cierre en una sola petición (ver `CierreRequest`). */
export interface AutorizacionCierre {
  usuario: string;
  password: string;
}

/**
 * Modal de autorización de cierre (FE-B3). Réplica de `#ModalAutorizarCierre` en
 * `Views/Ventas/Ventas.cshtml` + `ModalAutorizarCierre()`/`$('#btnAutorizarCierre').click()` de
 * `EvtVentas.js`: captura usuario/contraseña de un supervisor cuando la configuración exige
 * autorizar el cierre (`ValidaApertura.requiereAutorizacionCierre`).
 *
 * Diferencia con el legado: el legado valida la contraseña en un paso previo
 * (`/Ventas/ValidarContrasena`) y luego llama al cierre. Aquí el modal solo **captura** las
 * credenciales; la validación real ocurre en el servidor dentro de la misma petición de cierre
 * (`CajaService.cerrarCaja`, contrato nuevo de `API-B4`) — no hay llamada HTTP en este diálogo.
 */
@Component({
  selector: 'app-autorizar-cierre-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TranslatePipe],
  templateUrl: './autorizar-cierre-dialog.component.html',
})
export class AutorizarCierreDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<AutorizarCierreDialogComponent>);

  readonly enviando = signal(false);

  readonly autorizarCierreForm = this.fb.group({
    usuario: ['', Validators.required],
    password: ['', Validators.required],
  });

  autorizar(): void {
    if (this.autorizarCierreForm.invalid) {
      this.notify.notify(
        'warning',
        this.translate.instant('ventas.caja.autorizar.msg.credencialesRequeridas'),
      );
      this.autorizarCierreForm.markAllAsTouched();
      return;
    }

    const raw = this.autorizarCierreForm.getRawValue();
    const datos: AutorizacionCierre = { usuario: raw.usuario ?? '', password: raw.password ?? '' };
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, data: datos }));
  }

  cerrar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
