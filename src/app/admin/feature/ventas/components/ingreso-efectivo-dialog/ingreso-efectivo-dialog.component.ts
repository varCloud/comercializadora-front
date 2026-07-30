import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { IngresoEfectivoRequestModel } from 'src/app/admin/models/ventas/ingreso-efectivo-request';
import { TipoIngresoEfectivoId } from 'src/app/admin/models/ventas/tipo-ingreso-efectivo';
import { CajaService } from 'src/app/admin/services/caja.service';
import { abrirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';

/**
 * Diálogo "Ingreso de Efectivo" del POS (réplica exacta de `_IngresoEfectivo.cshtml` +
 * `AbrirModalIngresoEfectivo()`/`onSuccessResultIngresoEfectivo()` de `EvtVentas.js`): un único
 * campo de monto y el botón Guardar, sin nada más. `idTipoIngresoEfectivo = 2` ("Solicitud de
 * efectivo", igual que el legado). Al guardar con éxito el legado imprime el ticket y cierra el
 * modal de inmediato (no deja un botón "ver ticket" abierto) — se replica ese mismo flujo aquí.
 */
@Component({
  selector: 'app-ingreso-efectivo-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TranslatePipe, BlockUIModule],
  templateUrl: './ingreso-efectivo-dialog.component.html',
})
export class IngresoEfectivoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cajaService = inject(CajaService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<IngresoEfectivoDialogComponent>);

  @BlockUI('ingresoEfectivoDialog') blockUI!: NgBlockUI;

  readonly guardando = signal(false);

  readonly ingresoForm = this.fb.group({
    monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  guardar(): void {
    if (this.ingresoForm.invalid || this.guardando()) {
      this.ingresoForm.markAllAsTouched();
      return;
    }

    const monto = Number(this.ingresoForm.value.monto ?? 0);
    const request = new IngresoEfectivoRequestModel({
      monto,
      idTipoIngresoEfectivo: TipoIngresoEfectivoId.SolicitudEfectivo,
    });

    this.guardando.set(true);
    this.blockUI.start(this.translate.instant('ventas.caja.ingreso.msg.guardando'));
    this.cajaService
      .registrarIngreso(request)
      .pipe(
        finalize(() => {
          this.guardando.set(false);
          this.blockUI.stop();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify('success', res.mensaje ?? this.translate.instant('ventas.caja.ingreso.msg.exito'));
            const idIngreso = res.modelo ?? null;
            this.dialogRef.close();
            if (idIngreso) this.imprimirTicket(idIngreso);
          } else {
            this.notify.notify('error', res?.mensaje ?? this.translate.instant('ventas.caja.ingreso.msg.error'));
          }
        },
        error: (err) => {
          console.error('Error al registrar el ingreso de efectivo', err);
          this.notify.notify('error', this.translate.instant('ventas.caja.ingreso.msg.error'));
        },
      });
  }

  private imprimirTicket(idIngreso: number): void {
    this.cajaService.obtenerTicketPdf(idIngreso, 'ingreso').subscribe({
      next: (blob) => abrirPdfBlob(blob),
      error: (err) => console.error('Error al generar el ticket PDF del ingreso', err),
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
