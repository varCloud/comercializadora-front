import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { PedidoEspecialDetalle } from 'src/app/admin/models/pedidos-especiales/pedido-especial-detalle';
import { RealizarDevolucionRequestModel } from 'src/app/admin/models/pedidos-especiales/realizar-devolucion-request';
import { ProductoDevueltoRequestModel } from 'src/app/admin/models/pedidos-especiales/producto-devuelto-request';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';

/** Datos de apertura del diálogo: el folio sobre el que se registra la devolución. */
export interface RegistrarDevolucionData {
  folio: number;
}

/** Línea editable del formulario de devolución (producto + cantidad a devolver capturada). */
interface LineaDevolucion {
  producto: PedidoEspecialDetalle;
  cantidadDevuelta: number;
}

/**
 * Diálogo "Registrar Devolución" (Bloque D) — réplica de `MostrarDetalleDevolucion` +
 * `#btnRealizarDevolucion` de `EvtConsultaPedidosEspecialesV2.js`. Solo se listan líneas con
 * `cantidad > 0` (igual que el legado). El total a devolver se recalcula en vivo con la misma
 * fórmula del legado (`actualizarSubTotalDevoluciones`):
 * `Σ(cantidadDevuelta × precioVenta) + Σ(cantidadDevuelta × (montoComisionBancaria / cantidad))`
 * — el backend (`SP_REALIZA_DEVOLUCION_PEDIDOS_ESPECIALES`) valida que `montoDevuelto` coincida
 * exactamente con este cálculo y rechaza la operación si no calza.
 */
@Component({
  selector: 'app-registrar-devolucion-dialog',
  standalone: true,
  imports: [
    MaterialModule,
    MatDialogModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    FormsModule,
    CurrencyPipe,
  ],
  templateUrl: './registrar-devolucion-dialog.component.html',
  styleUrl: './registrar-devolucion-dialog.component.scss',
})
export class RegistrarDevolucionDialogComponent implements OnInit {
  private readonly service = inject(PedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RegistrarDevolucionDialogComponent>);
  readonly data = inject<RegistrarDevolucionData>(MAT_DIALOG_DATA);

  @BlockUI('registrarDevolucion') blockUI!: NgBlockUI;

  readonly lineas = signal<LineaDevolucion[]>([]);
  readonly cargado = signal(false);

  /** Formulario del motivo de la devolución (regla 12: `this.fb.group`, nombre descriptivo). */
  readonly devolucionForm = this.fb.group({
    motivoDevolucion: ['', Validators.required],
  });

  /** Réplica de `actualizarSubTotalDevoluciones()` del legado. */
  readonly totalADevolver = computed(() =>
    this.round2(
      this.lineas().reduce((acc, l) => {
        const comisionProrrateada =
          l.producto.cantidad > 0 ? ((l.producto.montoComisionBancaria ?? 0) * l.cantidadDevuelta) / l.producto.cantidad : 0;
        return acc + l.cantidadDevuelta * l.producto.precioVenta + comisionProrrateada;
      }, 0),
    ),
  );

  ngOnInit(): void {
    this.blockUI.start();
    this.service
      .obtenerDetalle(this.data.folio)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (productos) => {
          // Réplica de `if (dato.cantidad > 0)` del legado: solo líneas con cantidad devolvible.
          this.lineas.set(
            productos.filter((p) => p.cantidad > 0).map((producto) => ({ producto, cantidadDevuelta: 0 })),
          );
          this.cargado.set(true);
        },
        error: (err) => {
          console.error('Error al cargar el detalle del pedido especial para devolución', err);
          this.notify.notify('error', this.translate.instant('registrarDevolucionDialog.msg.loadError'));
          this.cargado.set(true);
        },
      });
  }

  /**
   * Réplica de `fnActualizaDevolucion`: no permite capturar más de lo que se compró; enteros
   * salvo que la línea sea fraccionable (`fraccion`, regla del legado `esDecimal`/`esNumero`).
   */
  onCantidadDevueltaChange(linea: LineaDevolucion, valor: number): void {
    let cantidad = Number(valor);
    if (isNaN(cantidad) || cantidad < 0) cantidad = 0;
    if (!linea.producto.fraccion) cantidad = Math.trunc(cantidad);

    if (cantidad > linea.producto.cantidad) {
      this.notify.notify('warning', this.translate.instant('registrarDevolucionDialog.msg.excedeCantidad'));
      cantidad = linea.producto.cantidad;
    }

    this.lineas.update((actuales) =>
      actuales.map((l) =>
        l.producto.idPedidoEspecialDetalle === linea.producto.idPedidoEspecialDetalle
          ? { ...l, cantidadDevuelta: cantidad }
          : l,
      ),
    );
  }

  /** Botón "Realizar Devolución" (réplica de `#btnRealizarDevolucion`). */
  guardar(): void {
    const lineasDevueltas = this.lineas().filter((l) => l.cantidadDevuelta > 0);

    if (lineasDevueltas.length === 0) {
      this.notify.notify('warning', this.translate.instant('registrarDevolucionDialog.msg.sinProductos'));
      return;
    }

    if (this.devolucionForm.invalid) {
      this.devolucionForm.markAllAsTouched();
      this.notify.notify('warning', this.translate.instant('registrarDevolucionDialog.msg.motivoRequerido'));
      return;
    }

    const request = new RealizarDevolucionRequestModel({
      productos: lineasDevueltas.map(
        (l) =>
          new ProductoDevueltoRequestModel({
            idProducto: l.producto.idProducto,
            idPedidoEspecialDetalle: l.producto.idPedidoEspecialDetalle,
            productosDevueltos: l.cantidadDevuelta,
          }),
      ),
      montoDevuelto: this.totalADevolver(),
      motivoDevolucion: this.devolucionForm.value.motivoDevolucion ?? '',
    });

    this.blockUI.start(this.translate.instant('registrarDevolucionDialog.msg.guardando'));
    this.service
      .realizarDevolucion(this.data.folio, request)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify(
              'success',
              res.mensaje || this.translate.instant('registrarDevolucionDialog.msg.guardadoOk'),
            );
            this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK }));
          } else {
            this.notify.notify(
              'error',
              res?.mensaje ?? this.translate.instant('registrarDevolucionDialog.msg.saveFallback'),
            );
          }
        },
        error: (err) => {
          console.error('Error al registrar la devolución del pedido especial', err);
          this.notify.notify('error', this.translate.instant('registrarDevolucionDialog.msg.saveError'));
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }

  private round2(n: number): number {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }
}
