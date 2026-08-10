import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { PedidoEspecialPendiente } from 'src/app/admin/models/pedidos-especiales/pedido-especial-pendiente';
import { ValidarUsuarioPedidoEspecialRequestModel } from 'src/app/admin/models/pedidos-especiales/validar-usuario-pedido-especial-request';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';

/** Estatus en los que el legado considera el ticket "entregado" y por tanto autorizable. */
const ESTATUS_ENTREGADO = [4, 5, 6, 7];
/** Mínimo de artículos que exige el legado para autorizar precio de mayoreo. */
const MIN_ARTICULOS_MAYOREO = 6;

/**
 * Modal "Autorizar Precio de Mayoreo" — réplica de `#ModalAutorizarPrecioMayoreo` +
 * `btnConsultaTicketMayoreo`/`btnAutorizarTicketMayoreo` (`EvtPedidosEspecialesV2.js:1680-1815`).
 *
 * 1) Consulta el ticket por folio y solo lo acepta entregado (estatus 4-7) y con 6+ artículos —
 *    reusa `GET pendientes-entrega` (mismo SP que `ConsultaDatosTicketPedidoEspecialV2`).
 * 2) Valida usuario/contraseña (`POST caja/validar-usuario` = `SP_VALIDA_USUARIO`) y confirma.
 *    Devuelve el folio, que la pantalla usa como `idPedidoEspecialMayoreo`.
 */
@Component({
  selector: 'app-aprobar-precio-mayoreo-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TranslatePipe, CurrencyPipe],
  templateUrl: './aprobar-precio-mayoreo-dialog.component.html',
})
export class AprobarPrecioMayoreoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<AprobarPrecioMayoreoDialogComponent>);

  readonly consultando = signal(false);
  readonly autorizando = signal(false);
  /** Ticket ya consultado y válido (null = todavía no hay uno). */
  readonly ticket = signal<PedidoEspecialPendiente | null>(null);

  readonly mayoreoForm = this.fb.group({
    folio: [null as number | null, [Validators.required, Validators.min(1)]],
    usuario: ['', Validators.required],
    contrasena: ['', Validators.required],
  });

  consultar(): void {
    if (this.consultando()) return;

    this.ticket.set(null);
    const folio = Number(this.mayoreoForm.value.folio ?? 0);
    if (!folio) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.mayoreo.msg.folioRequerido'));
      return;
    }

    this.consultando.set(true);
    this.service
      .obtenerPendientesEntrega(folio)
      .pipe(finalize(() => this.consultando.set(false)))
      .subscribe({
        next: (pedidos) => {
          const pedido = pedidos[0];
          if (!pedido) {
            this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.mayoreo.msg.noEncontrado'));
            return;
          }

          if (!ESTATUS_ENTREGADO.includes(pedido.idEstatusPedidoEspecial)) {
            this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.mayoreo.msg.noEntregado'));
            return;
          }

          if (pedido.cantidad < MIN_ARTICULOS_MAYOREO) {
            this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.mayoreo.msg.minArticulos'));
            return;
          }

          this.ticket.set(pedido);
        },
        error: (err) => {
          console.error('Error al consultar el ticket de mayoreo', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.mayoreo.msg.errorConsulta'));
        },
      });
  }

  autorizar(): void {
    if (this.autorizando()) return;

    const raw = this.mayoreoForm.getRawValue();
    const usuario = (raw.usuario ?? '').trim();
    const contrasena = raw.contrasena ?? '';

    if (!usuario || !contrasena) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.mayoreo.msg.credencialesRequeridas'));
      return;
    }

    const ticket = this.ticket();
    if (!ticket) {
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.mayoreo.msg.consultaPrimero'));
      return;
    }

    this.autorizando.set(true);
    this.service
      .validarUsuarioCierre(new ValidarUsuarioPedidoEspecialRequestModel({ usuario, contrasena }))
      .pipe(finalize(() => this.autorizando.set(false)))
      .subscribe({
        next: (res) => {
          if (res?.estatus !== 200) {
            this.notify.notify('error', res?.mensaje ?? this.translate.instant('pedidosEspeciales.nuevoPedido.mayoreo.msg.errorAutorizar'));
            return;
          }

          Swal.fire({
            title: this.translate.instant('pedidosEspeciales.nuevoPedido.confirm.title'),
            text: this.translate.instant('pedidosEspeciales.nuevoPedido.mayoreo.confirm'),
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('pedidosEspeciales.nuevoPedido.confirm.accept'),
            cancelButtonText: this.translate.instant('pedidosEspeciales.nuevoPedido.confirm.cancel'),
          }).then((result) => {
            if (!result.isConfirmed) return;
            this.dialogRef.close(
              new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, data: ticket.idPedidoEspecial }),
            );
          });
        },
        error: (err) => {
          console.error('Error al validar al usuario que autoriza el precio de mayoreo', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.nuevoPedido.mayoreo.msg.errorAutorizar'));
        },
      });
  }

  cerrar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
