import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { VentaDevolucionComplemento } from 'src/app/admin/models/ventas/venta-devolucion-complemento';
import { VentasService } from 'src/app/admin/services/ventas.service';
import { abrirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';

/** Datos que recibe el modal al abrirse: el id de la venta consultada. */
export interface VentaDevolucionesComplementosDialogData {
  idVenta: number;
}

/**
 * Modal "Devoluciones / complementos" (FE-C3/FE-C4) — tickets de devolución y complemento
 * asociados a una venta, en dos pestañas. Réplica de `_ObtenerTicketsDevolucionesComplementos`
 * del legado, ahora combinados en una sola respuesta (`GET /ventas/{id}/devoluciones-complementos`).
 * Un estado vacío en cualquiera de las dos listas es normal (una venta puede no tener
 * devoluciones ni complementos), no un error.
 */
@Component({
  selector: 'app-venta-devoluciones-complementos-dialog',
  standalone: true,
  imports: [MaterialModule, TranslatePipe, BlockUIModule, CurrencyPipe, DatePipe, TablerIconsModule],
  templateUrl: './venta-devoluciones-complementos-dialog.component.html',
  styleUrl: './venta-devoluciones-complementos-dialog.component.scss',
})
export class VentaDevolucionesComplementosDialogComponent implements OnInit {
  private readonly ventasService = inject(VentasService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<VentaDevolucionesComplementosDialogComponent>);
  readonly data = inject<VentaDevolucionesComplementosDialogData>(MAT_DIALOG_DATA);

  @BlockUI('ventaDevolucionesComplementos') blockUI!: NgBlockUI;

  readonly devoluciones = signal<VentaDevolucionComplemento[]>([]);
  readonly complementos = signal<VentaDevolucionComplemento[]>([]);
  readonly generandoTicket = signal(false);

  readonly displayedColumnsDevoluciones = ['fechaAlta', 'cantidad', 'montoTotal', 'observaciones', 'accion'];
  readonly displayedColumnsComplementos = ['fechaAlta', 'cantidad', 'montoTotal', 'accion'];

  ngOnInit(): void {
    this.blockUI.start(this.translate.instant('ventas.devolucionesComplementos.msg.cargando'));
    this.ventasService
      .obtenerDevolucionesComplementos(this.data.idVenta)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => {
          this.devoluciones.set(res.devoluciones);
          this.complementos.set(res.complementos);
        },
        error: (err) => {
          console.error('Error al consultar devoluciones y complementos de la venta', err);
          this.notify.notify('error', this.translate.instant('ventas.devolucionesComplementos.msg.error'));
        },
      });
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  /** "Ver ticket" del ticket de devolución (FE-D1): venta original + `idDevolucion` de la fila. */
  verTicketDevolucion(item: VentaDevolucionComplemento): void {
    this.abrirTicket('devolucion', { idDevolucion: item.idDevolucion });
  }

  /** "Ver ticket" del ticket de complemento (FE-D1): venta original + `idComplemento` de la fila. */
  verTicketComplemento(item: VentaDevolucionComplemento): void {
    this.abrirTicket('complemento', { idComplemento: item.idComplemento });
  }

  private abrirTicket(
    tipo: 'devolucion' | 'complemento',
    opts: { idDevolucion?: number; idComplemento?: number },
  ): void {
    if (this.generandoTicket()) return;

    this.generandoTicket.set(true);
    this.ventasService
      .obtenerTicketPdf(this.data.idVenta, tipo, opts)
      .pipe(finalize(() => this.generandoTicket.set(false)))
      .subscribe({
        next: (blob) => abrirPdfBlob(blob),
        error: (err) => {
          console.error('Error al generar el ticket PDF', err);
          this.notify.notify('error', this.translate.instant('ventas.devolucionesComplementos.msg.errorTicket'));
        },
      });
  }
}
