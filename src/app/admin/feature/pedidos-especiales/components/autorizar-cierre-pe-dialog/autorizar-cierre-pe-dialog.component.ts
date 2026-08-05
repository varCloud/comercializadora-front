import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { ValidarUsuarioPedidoEspecialRequestModel } from 'src/app/admin/models/pedidos-especiales/validar-usuario-pedido-especial-request';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';

/** Datos capturados y ya validados: se envían junto al cierre en la misma petición (ver `CierrePedidoEspecialRequest`). */
export interface AutorizacionCierrePe {
  usuario: string;
  contrasena: string;
}

/**
 * Modal de autorización de cierre de Pedidos Especiales (FE-5, `cierre_caja_pe`). Réplica de
 * `ModalAutorizarCierre`/`evtCierreCajasPedidosEspeciales.js::RequiereAutorizacion()` del legado.
 *
 * Diferencia con `AutorizarCierreDialogComponent` (Ventas): aquí SÍ se llama
 * `POST caja/validar-usuario` (`PedidosEspecialesService.validarUsuarioCierre`) antes de cerrar
 * — la HU pide replicar el paso de validación previa del legado (que en realidad llama
 * `/Ventas/ValidarContrasena`, mismo SP `SP_VALIDA_USUARIO`) en vez de solo capturar credenciales
 * y validarlas dentro de la misma petición de cierre.
 */
@Component({
  selector: 'app-autorizar-cierre-pe-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TranslatePipe],
  templateUrl: './autorizar-cierre-pe-dialog.component.html',
})
export class AutorizarCierrePeDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<AutorizarCierrePeDialogComponent>);

  readonly validando = signal(false);

  readonly autorizarForm = this.fb.group({
    usuario: ['', Validators.required],
    contrasena: ['', Validators.required],
  });

  autorizar(): void {
    if (this.autorizarForm.invalid || this.validando()) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.caja.autorizar.msg.credencialesRequeridas'),
      );
      this.autorizarForm.markAllAsTouched();
      return;
    }

    const raw = this.autorizarForm.getRawValue();
    const usuario = raw.usuario ?? '';
    const contrasena = raw.contrasena ?? '';
    const request = new ValidarUsuarioPedidoEspecialRequestModel({ usuario, contrasena });

    this.validando.set(true);
    this.service
      .validarUsuarioCierre(request)
      .pipe(finalize(() => this.validando.set(false)))
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            const datos: AutorizacionCierrePe = { usuario, contrasena };
            this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, data: datos }));
          } else {
            this.notify.notify(
              'error',
              res?.mensaje ?? this.translate.instant('pedidosEspeciales.caja.autorizar.msg.error'),
            );
          }
        },
        error: (err) => {
          console.error('Error al validar el usuario autorizador del cierre de Pedidos Especiales', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.autorizar.msg.error'));
        },
      });
  }

  cerrar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
