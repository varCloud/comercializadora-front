import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import Swal from 'sweetalert2';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { ClientesService } from 'src/app/admin/services/clientes.service';

/** Modo con el que se abre el modal: alta de pedido especial o guardado como cotización. */
export interface GenerarPedidoEspecialDialogData {
  modo: 'pedido' | 'cotizacion';
}

/** Elección del usuario, tal como la consume `GuardarPedidoEspecial(tipoRevision, idEstatus)`. */
export interface GenerarPedidoEspecialResultado {
  idCliente: number;
  /** 1 = Revisión por Ticket, 2 = Revisión por Hand Held, 3 = Cotización. */
  tipoRevision: number;
  /** 1 = pedido especial, 2 = cotización. */
  idEstatusPedidoEspecial: number;
  /** `#chkImprimePrevio` del legado ("¿Desea imprimir el ticket del cliente?"). */
  imprimirTicketCliente: boolean;
}

/**
 * Modal "Generar Pedido Especial" — réplica de `#ModalGuardarPedidoEspecial` +
 * `abrirModalGuardarPedidoEspecial(tipo)` (`EvtPedidosEspecialesV2.js:530-576`): aquí se elige el
 * cliente (el legado no lo captura en la pantalla) y el tipo de revisión.
 *
 * Modo `pedido`: botones "Revisión por Ticket" (1,1) y "Hand Held" (2,1) + checkbox de impresión.
 * Modo `cotizacion`: un solo "Guardar" (3,2). Cada acción confirma con SweetAlert; el guardado
 * real lo hace `NuevoPedidoComponent`.
 */
@Component({
  selector: 'app-generar-pedido-especial-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TranslatePipe, SelectPaginadoComponent],
  templateUrl: './generar-pedido-especial-dialog.component.html',
})
export class GenerarPedidoEspecialDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clientesService = inject(ClientesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<GenerarPedidoEspecialDialogComponent>);
  readonly data = inject<GenerarPedidoEspecialDialogData>(MAT_DIALOG_DATA);

  /** Cliente 1 = público en general, default del legado (`$('#idCliente').val("1")`). */
  readonly generarForm = this.fb.group({
    idCliente: [1 as number | null, Validators.required],
    imprimirTicketCliente: [false],
  });

  readonly esCotizacion = this.data.modo === 'cotizacion';

  /** Catálogo grande (>25) → selector paginado (regla 16), reusando `ClientesService` (regla 00). */
  readonly fetchClientes = (q: string, page: number) =>
    this.clientesService.listar({ q, page, perPage: 25 }).pipe(map((res) => res.data));

  /** "Revisión por Ticket" del legado. */
  revisionPorTicket(): void {
    this.confirmarYCerrar('pedidosEspeciales.nuevoPedido.confirm.porTicket', 1, 1);
  }

  /** "Revisión por Hand Held" del legado. */
  revisionPorHandHeld(): void {
    this.confirmarYCerrar('pedidosEspeciales.nuevoPedido.confirm.porHandHeld', 2, 1);
  }

  /** "Guardar" del modo cotización (`btnCotizar`). */
  cotizar(): void {
    this.confirmarYCerrar('pedidosEspeciales.nuevoPedido.confirm.cotizacion', 3, 2);
  }

  private confirmarYCerrar(claveTexto: string, tipoRevision: number, idEstatusPedidoEspecial: number): void {
    const idCliente = Number(this.generarForm.value.idCliente ?? 0);
    if (!idCliente) {
      this.generarForm.markAllAsTouched();
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.nuevoPedido.msg.clienteRequerido'));
      return;
    }

    Swal.fire({
      title: this.translate.instant('pedidosEspeciales.nuevoPedido.confirm.title'),
      text: this.translate.instant(claveTexto),
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('pedidosEspeciales.nuevoPedido.confirm.accept'),
      cancelButtonText: this.translate.instant('pedidosEspeciales.nuevoPedido.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;

      const resultado: GenerarPedidoEspecialResultado = {
        idCliente,
        tipoRevision,
        idEstatusPedidoEspecial,
        imprimirTicketCliente: !!this.generarForm.value.imprimirTicketCliente,
      };
      this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, data: resultado }));
    });
  }

  cerrar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
