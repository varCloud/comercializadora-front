import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CurrencyPipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { PedidoEspecialDetalle } from 'src/app/admin/models/pedidos-especiales/pedido-especial-detalle';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';

/** Datos de apertura del diálogo: el folio del pedido en ruta a detallar. */
export interface VerProductosPedidoRutaData {
  folio: number;
}

/**
 * Diálogo "Ver Productos" (P-04, Pedidos en Ruta) — réplica de solo lectura de
 * `MostrarDetallePedidoRuta` (`EvtConsultaPedidosEnRuta.js:167-230`) y su modal
 * `#modalDetallePedidoRuta` (`PedidosEnRuta.cshtml:92-121`). Reusa el mismo endpoint que "Ver
 * Detalle"/"Registrar Devolución" de Consultar Pedidos (`PedidosEspecialesService.obtenerDetalle`,
 * regla 00) pero **no** es el mismo diálogo: el legado, en esta pantalla, muestra una tabla de
 * solo lectura con columnas distintas (Id Producto, Producto, Almacén, Precio, Cantidad, Total) y
 * sin acciones de bitácora/devolución — por eso es un componente propio y no una reutilización de
 * `PedidoEspecialDetalleDialogComponent`. Solo pinta líneas con `cantidad > 0` (mismo filtro que
 * el legado).
 */
@Component({
  selector: 'app-ver-productos-pedido-ruta-dialog',
  standalone: true,
  imports: [MaterialModule, MatDialogModule, BlockUIModule, TranslatePipe, CurrencyPipe],
  templateUrl: './ver-productos-pedido-ruta-dialog.component.html',
})
export class VerProductosPedidoRutaDialogComponent implements OnInit {
  private readonly service = inject(PedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  readonly data = inject<VerProductosPedidoRutaData>(MAT_DIALOG_DATA);

  @BlockUI('verProductosPedidoRuta') blockUI!: NgBlockUI;

  readonly displayedColumns = ['idProducto', 'descripcion', 'almacen', 'precioVenta', 'cantidad', 'monto'];
  private readonly productosCompletos = signal<PedidoEspecialDetalle[]>([]);
  readonly cargado = signal(false);

  /** Réplica de `if (dato.cantidad > 0)` en `MostrarDetallePedidoRuta`. */
  readonly productos = computed(() => this.productosCompletos().filter((p) => p.cantidad > 0));

  ngOnInit(): void {
    this.blockUI.start();
    this.service
      .obtenerDetalle(this.data.folio)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (productos) => {
          this.productosCompletos.set(productos);
          this.cargado.set(true);
        },
        error: (err) => {
          console.error('Error al cargar los productos del pedido en ruta', err);
          this.notify.notify('error', this.translate.instant('verProductosPedidoRutaDialog.msg.loadError'));
          this.cargado.set(true);
        },
      });
  }
}
