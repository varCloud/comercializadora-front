import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { PedidoEspecialHistorico } from 'src/app/admin/models/pedidos-especiales/pedido-especial-historico';
import { PedidoEspecialDetalle } from 'src/app/admin/models/pedidos-especiales/pedido-especial-detalle';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';
import {
  BitacoraDetalleData,
  BitacoraDetalleDialogComponent,
} from 'src/app/admin/feature/bitacoras/components/bitacora-detalle-dialog/bitacora-detalle-dialog.component';
import {
  RegistrarDevolucionDialogComponent,
  RegistrarDevolucionData,
} from '../registrar-devolucion-dialog/registrar-devolucion-dialog.component';

/** Datos de apertura del diálogo: la fila del listado "Consultar Pedidos" a detallar. */
export interface PedidoEspecialDetalleData {
  pedido: PedidoEspecialHistorico;
}

/**
 * Diálogo "Ver Detalle" (Bloque D, FE-D4) — réplica de `MostrarDetalle` de
 * `EvtConsultaPedidosEspecialesV2.js`: datos generales del pedido + tabla de productos
 * (`ObtenerPedidosEspecialesDetalle`, mismo endpoint/SP que "Confirmar Productos" de Bloque B).
 * Agrega dos accesos que en el legado eran acciones aparte del dropdown de la fila, ahora
 * reunidas aquí para no obligar a cerrar el detalle:
 * - **"Ver Bitácora"**: reusa `BitacoraDetalleDialogComponent` (feature `bitacoras`, ya
 *   migrado) pasando `idPedidoInterno = folio` (mismo id, ver nota de la API en Bloque D sobre
 *   por qué no hay un SP/endpoint de bitácora propio de Pedidos Especiales).
 * - **"Registrar Devolución"**: solo si `pedido.puedeDevolver` (réplica del `if
 *   (dato.puede_devolver == true)` del dropdown legado); abre
 *   `RegistrarDevolucionDialogComponent` apilado. Si la devolución se guarda con éxito, este
 *   diálogo también se cierra con `OK` para que el listado padre se refresque.
 */
@Component({
  selector: 'app-pedido-especial-detalle-dialog',
  standalone: true,
  imports: [MaterialModule, MatDialogModule, TablerIconsModule, BlockUIModule, TranslatePipe, CurrencyPipe],
  templateUrl: './pedido-especial-detalle-dialog.component.html',
  styleUrl: './pedido-especial-detalle-dialog.component.scss',
})
export class PedidoEspecialDetalleDialogComponent implements OnInit {
  private readonly service = inject(PedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<PedidoEspecialDetalleDialogComponent>);
  readonly data = inject<PedidoEspecialDetalleData>(MAT_DIALOG_DATA);

  @BlockUI('pedidoEspecialDetalle') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'idPedidoEspecialDetalle',
    'descripcion',
    'almacen',
    'cantidad',
    'cantidadAtendida',
    'cantidadRechazada',
    'cantidadAceptada',
    'monto',
    'precioVenta',
    'estatusPedidoEspecialDetalle',
  ];

  readonly productos = signal<PedidoEspecialDetalle[]>([]);
  readonly cargado = signal(false);

  get pedido(): PedidoEspecialHistorico {
    return this.data.pedido;
  }

  ngOnInit(): void {
    this.blockUI.start();
    this.service
      .obtenerDetalle(this.pedido.idPedidoEspecial)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (productos) => {
          this.productos.set(productos);
          this.cargado.set(true);
        },
        error: (err) => {
          console.error('Error al cargar el detalle del pedido especial', err);
          this.notify.notify('error', this.translate.instant('pedidoEspecialDetalleDialog.msg.loadError'));
          this.cargado.set(true);
        },
      });
  }

  verBitacora(): void {
    this.dialog.open<BitacoraDetalleDialogComponent, BitacoraDetalleData>(BitacoraDetalleDialogComponent, {
      data: { idPedidoInterno: this.pedido.idPedidoEspecial },
      width: '640px',
      maxWidth: '95vw',
    });
  }

  registrarDevolucion(): void {
    const ref = this.dialog.open<RegistrarDevolucionDialogComponent, RegistrarDevolucionData>(
      RegistrarDevolucionDialogComponent,
      {
        data: { folio: this.pedido.idPedidoEspecial },
        width: '1000px',
        maxWidth: '95vw',
        disableClose: true,
      },
    );

    ref.afterClosed().subscribe((res: ResultModalModel | undefined) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) {
        // La devolución se guardó: cierra también el detalle para que el listado padre recargue.
        this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK }));
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
