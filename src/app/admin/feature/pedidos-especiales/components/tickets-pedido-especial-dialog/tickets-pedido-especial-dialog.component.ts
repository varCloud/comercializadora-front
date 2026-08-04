import { Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CurrencyPipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { TicketPedidoEspecialResumen } from 'src/app/admin/models/pedidos-especiales/ticket-pedido-especial-resumen';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';

/** Datos de apertura del diálogo: el folio cuyos tickets se listan. */
export interface TicketsPedidoEspecialData {
  folio: number;
}

/**
 * Diálogo "Tickets" (Bloque D) — réplica de solo lectura de la acción `Tickets` /
 * `_ObtenerTicketsPedidoEspecial` del legado (dropdown "Acciones", visible solo si
 * `existeTicket == true`). La API expone únicamente los datos crudos del listado (sin
 * regenerar el PDF de cada ticket histórico ni el detalle de líneas — ver desviación
 * documentada en Bloque D: la impresión física GDI del legado no es portable a la API web), así
 * que este diálogo solo lista folio/tipo/fecha/monto de cada ticket, sin acción de impresión.
 */
@Component({
  selector: 'app-tickets-pedido-especial-dialog',
  standalone: true,
  imports: [MaterialModule, MatDialogModule, BlockUIModule, TranslatePipe, CurrencyPipe],
  templateUrl: './tickets-pedido-especial-dialog.component.html',
  styleUrl: './tickets-pedido-especial-dialog.component.scss',
})
export class TicketsPedidoEspecialDialogComponent implements OnInit {
  private readonly service = inject(PedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  readonly data = inject<TicketsPedidoEspecialData>(MAT_DIALOG_DATA);

  @BlockUI('ticketsPedidoEspecial') blockUI!: NgBlockUI;

  readonly displayedColumns = ['idTicketPedidoEspecial', 'tipoTicket', 'fechaTicket', 'cantidad', 'montoTotal'];
  readonly tickets = signal<TicketPedidoEspecialResumen[]>([]);
  readonly cargado = signal(false);

  ngOnInit(): void {
    this.blockUI.start();
    this.service
      .obtenerTickets(this.data.folio)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (tickets) => {
          this.tickets.set(tickets);
          this.cargado.set(true);
        },
        error: (err) => {
          console.error('Error al cargar los tickets del pedido especial', err);
          this.notify.notify('error', this.translate.instant('ticketsPedidoEspecialDialog.msg.loadError'));
          this.cargado.set(true);
        },
      });
  }
}
