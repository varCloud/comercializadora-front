import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { Venta } from 'src/app/admin/models/ventas/venta';
import { EstatusVentaId } from 'src/app/admin/models/ventas/estatus-venta';
import { VentasService } from 'src/app/admin/services/ventas.service';

/** Datos que recibe el modal al abrirse: el id de la venta a consultar. */
export interface VentaDetalleDialogData {
  idVenta: number;
}

/**
 * Modal de solo lectura con el detalle de una venta (encabezado + líneas del ticket) — acción
 * "Ver" del listado de consulta/edición de ventas (FE-C3/FE-C4). Reutiliza
 * `VentasService.obtenerPorId` (ya existente desde el Bloque A, POS) en vez de duplicar el
 * fetch (regla 00).
 */
@Component({
  selector: 'app-venta-detalle-dialog',
  standalone: true,
  imports: [MaterialModule, TranslatePipe, BlockUIModule, CurrencyPipe, DatePipe],
  templateUrl: './venta-detalle-dialog.component.html',
})
export class VentaDetalleDialogComponent implements OnInit {
  private readonly ventasService = inject(VentasService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<VentaDetalleDialogComponent>);
  readonly data = inject<VentaDetalleDialogData>(MAT_DIALOG_DATA);

  @BlockUI('ventaDetalle') blockUI!: NgBlockUI;

  readonly EstatusVentaId = EstatusVentaId;
  readonly venta = signal<Venta | null>(null);

  readonly displayedColumns = ['descProducto', 'cantidad', 'precioVenta', 'monto'];

  ngOnInit(): void {
    this.blockUI.start(this.translate.instant('ventas.detalle.msg.cargando'));
    this.ventasService
      .obtenerPorId(this.data.idVenta)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (venta) => this.venta.set(venta),
        error: (err) => {
          console.error('Error al consultar el detalle de la venta', err);
          this.notify.notify('error', this.translate.instant('ventas.detalle.msg.error'));
        },
      });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
