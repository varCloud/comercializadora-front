import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { PedidoEspecialProducto } from 'src/app/admin/models/ventas/pedido-especial-producto';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';

/** Datos que devuelve el modal al cerrarse (dentro de `ResultModalModel.data`), consumidos por
 * `PosComponent` para completar el mapeo a `ProductoVenta` y llamar `agregarProducto()`. */
export interface BuscarPedidoEspecialResult {
  folio: number;
  productos: PedidoEspecialProducto[];
}

/**
 * Diálogo "Buscar Pedido Especial" del POS (feature Ventas, Bloque E gap-fix, tarea FE-E4).
 * Réplica de `EvtVentas.js::BuscarPedidoEspecial()`/`AgregarPedidoEspecial()`: se busca el
 * pedido por folio, se muestran TODOS sus productos (habilitados e inhabilitados, con el
 * motivo), y el botón "Agregar todos" agrega de golpe TODOS los habilitados — sin selección
 * individual, réplica fiel del legado (más simple, decisión documentada en la HU).
 *
 * `habilitado`/`motivoInhabilitado`/`existenciaMenorASolicitada` ya vienen calculados desde la
 * API (`PedidoEspecialProducto`): este diálogo NO re-evalúa esas reglas de negocio.
 */
@Component({
  selector: 'app-buscar-pedido-especial-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TranslatePipe, BlockUIModule, CurrencyPipe],
  templateUrl: './buscar-pedido-especial-dialog.component.html',
})
export class BuscarPedidoEspecialDialogComponent {
  private readonly service = inject(PedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<BuscarPedidoEspecialDialogComponent>);

  @BlockUI('buscarPedidoEspecial') blockUI!: NgBlockUI;

  readonly folioControl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1)],
  });

  readonly folioConsultado = signal<number | null>(null);
  readonly productos = signal<PedidoEspecialProducto[]>([]);
  private readonly buscando = signal(false);

  readonly habilitados = computed(() => this.productos().filter((p) => p.habilitado));

  readonly displayedColumns = [
    'descripcion',
    'cantidadRecibida',
    'cantidad',
    'precioIndividual',
    'precioMenudeo',
    'estatus',
  ];

  buscar(): void {
    if (this.buscando()) return;

    const folio = Number(this.folioControl.value);
    if (!this.folioControl.value || folio <= 0) {
      this.notify.notify('warning', this.translate.instant('ventas.pos.pedidoEspecial.msg.folioRequerido'));
      return;
    }

    this.buscando.set(true);
    this.blockUI.start(this.translate.instant('ventas.pos.pedidoEspecial.msg.buscando'));
    this.service
      .obtenerProductos(folio)
      .pipe(
        finalize(() => {
          this.buscando.set(false);
          this.blockUI.stop();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.folioConsultado.set(folio);
            this.productos.set(res.modelo ?? []);
          } else {
            this.folioConsultado.set(null);
            this.productos.set([]);
            this.notify.notify(
              'error',
              res?.mensaje ?? this.translate.instant('ventas.pos.pedidoEspecial.msg.error'),
            );
          }
        },
        error: (err) => {
          console.error('Error al buscar el pedido especial', err);
          this.folioConsultado.set(null);
          this.productos.set([]);
          this.notify.notify('error', this.translate.instant('ventas.pos.pedidoEspecial.msg.error'));
        },
      });
  }

  /** Botón "Agregar todos los habilitados" (réplica exacta de `AgregarPedidoEspecial()`). */
  agregarTodos(): void {
    const folio = this.folioConsultado();
    const habilitados = this.habilitados();
    if (!folio || habilitados.length === 0) {
      this.notify.notify(
        'warning',
        this.translate.instant('ventas.pos.pedidoEspecial.msg.sinHabilitados'),
      );
      return;
    }

    const resultado: BuscarPedidoEspecialResult = { folio, productos: habilitados };
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, data: resultado }));
  }

  cerrar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
