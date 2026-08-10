import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { IngresoEfectivoPedidoEspecialRequestModel } from 'src/app/admin/models/pedidos-especiales/ingreso-efectivo-pedido-especial-request';
import { TipoIngresoPedidoEspecialId } from 'src/app/admin/models/pedidos-especiales/tipo-ingreso-pedido-especial';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';
import { imprimirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';

/** Tipo con el que se abre el modal: apertura de caja (1) o ingreso de efectivo del turno (2). */
export interface IngresoEfectivoDialogData {
  tipo: TipoIngresoPedidoEspecialId;
}

/**
 * Modal "Apertura de caja" / "Ingreso de Efectivo" — réplica de `AbrirModalIngresoEfectivo(tipo)`
 * (`evtIngresosRetirosEfectivo.js:117-128`), que vive dentro de la pantalla de alta.
 *
 * Apertura (tipo 1): se abre sola si no hay caja, no se puede cerrar (`disableClose`) y el monto
 * puede ser 0. Ingreso (tipo 2): cerrable y el monto debe ser > 0. Desviación: se agrega "Salir"
 * (el legado atrapa al usuario); la pantalla navega fuera si se cierra sin apertura.
 */
@Component({
  selector: 'app-ingreso-efectivo-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TranslatePipe],
  templateUrl: './ingreso-efectivo-dialog.component.html',
})
export class IngresoEfectivoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<IngresoEfectivoDialogComponent>);
  readonly data = inject<IngresoEfectivoDialogData>(MAT_DIALOG_DATA);

  readonly guardando = signal(false);

  readonly esApertura = computed(() => this.data.tipo === TipoIngresoPedidoEspecialId.AperturaCaja);

  /** Monto precargado en 0, igual que `$('#montoIngresoEfectivo').val(0)` del legado. */
  readonly ingresoForm = this.fb.group({
    monto: [0 as number | null, [Validators.required, Validators.min(0)]],
  });

  guardar(): void {
    if (this.guardando()) return;

    const monto = Number(this.ingresoForm.value.monto);

    if (this.ingresoForm.invalid || isNaN(monto)) {
      this.ingresoForm.markAllAsTouched();
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.caja.ingresoDialog.msg.montoRequerido'),
      );
      return;
    }

    // El legado solo exige > 0 para el ingreso de efectivo del turno, no para la apertura.
    if (!this.esApertura() && monto <= 0) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.caja.ingresoDialog.msg.montoMayorCero'),
      );
      return;
    }

    const request = new IngresoEfectivoPedidoEspecialRequestModel({ monto, idTipoIngreso: this.data.tipo });

    this.guardando.set(true);
    this.service
      .guardarIngresoEfectivo(request)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            if (this.esApertura()) this.service.marcarCajaAbierta();
            this.notify.notify(
              'success',
              res.mensaje || this.translate.instant('pedidosEspeciales.caja.ingresoDialog.msg.exito'),
            );
            if (res.modelo) this.imprimirTicket(res.modelo);
            this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK }));
          } else {
            this.notify.notify(
              'error',
              res?.mensaje ?? this.translate.instant('pedidosEspeciales.caja.ingresoDialog.msg.error'),
            );
          }
        },
        error: (err) => {
          console.error('Error al registrar el ingreso/apertura de caja de Pedidos Especiales', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.ingresoDialog.msg.error'));
        },
      });
  }

  /** Ticket del movimiento (el legado lo manda a la impresora térmica sin preguntar). */
  private imprimirTicket(idIngreso: number): void {
    this.service.obtenerTicketIngresoEfectivo(idIngreso).subscribe({
      next: (blob) => imprimirPdfBlob(blob),
      error: (err) => {
        console.error('Error al generar el ticket PDF del ingreso de efectivo', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.ingresoDialog.msg.errorTicket'));
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
