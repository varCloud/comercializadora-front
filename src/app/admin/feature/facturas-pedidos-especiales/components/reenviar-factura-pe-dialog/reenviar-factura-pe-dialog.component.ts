import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { DetalleVentaFactura } from 'src/app/admin/models/facturas/detalle-venta-factura';
import { FacturasService } from 'src/app/admin/services/facturas.service';

/** Datos de apertura del diálogo: el pedido especial a reenviar y el total CON impuestos de la
 *  fila (el detalle del back trae el total SIN IVA, ver nota en DetalleVentaFactura). Hermano de
 *  ReenviarFacturaData (ventas): cambia el identificador. */
export interface ReenviarFacturaPeData {
  idPedidoEspecial: number;
  montoTotal: number;
}

/**
 * Diálogo "Reenviar factura de pedido especial": muestra el detalle del pedido (cliente, forma
 * de pago, uso CFDI, totales) y permite reenviar el CFDI (PDF+XML) por correo, con copia
 * opcional (checkbox + validación de email, igual que el legado ModalFactura/
 * EvtFacturasPedidosEspeciales.js). Clon de ReenviarFacturaDialogComponent (ventas) con su
 * propio identificador: pantalla independiente por decisión del usuario (no se parametrizó un
 * diálogo compartido para ambas).
 */
@Component({
  selector: 'app-reenviar-factura-pe-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    MatDialogModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    CurrencyPipe,
  ],
  templateUrl: './reenviar-factura-pe-dialog.component.html',
  styleUrl: './reenviar-factura-pe-dialog.component.scss',
})
export class ReenviarFacturaPeDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(FacturasService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<ReenviarFacturaPeDialogComponent>);
  readonly data = inject<ReenviarFacturaPeData>(MAT_DIALOG_DATA);

  @BlockUI('reenviarFacturaPe') blockUI!: NgBlockUI;

  readonly detalle = signal<DetalleVentaFactura | null>(null);
  readonly cargado = signal(false);
  readonly enviando = signal(false);

  readonly reenviarForm = this.fb.group({
    enviarCopia: [false],
    correoCopia: ['', Validators.email],
  });

  /** Subtotal SIN IVA (detalle del back); total CON impuestos = montoTotal de la fila del
   *  listado; IVA = diferencia entre ambos (evita asumir una tasa fija, a diferencia del legado). */
  readonly subtotal = computed(() => this.detalle()?.total ?? 0);
  readonly total = computed(() => this.data.montoTotal);
  readonly iva = computed(() => Math.max(0, this.total() - this.subtotal()));

  ngOnInit(): void {
    this.reenviarForm.controls.enviarCopia.valueChanges.subscribe((marcado) =>
      this.aplicarValidacionCorreo(!!marcado),
    );

    this.blockUI.start();
    this.service
      .obtenerDetallePE(this.data.idPedidoEspecial)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (detalle) => {
          this.detalle.set(detalle);
          this.cargado.set(true);
        },
        error: (err) => {
          console.error('Error al cargar el detalle del pedido especial', err);
          this.notify.notify('error', this.translate.instant('facturasPe.detalle.loadError'));
          this.cargado.set(true);
        },
      });
  }

  /** Muestra/oculta y exige el correo solo cuando el checkbox "enviar copia" está marcado
   *  (paridad con el toggle #chkEnviarCopia/#divCorreoCopia del legado). */
  private aplicarValidacionCorreo(marcado: boolean): void {
    const correoCopia = this.reenviarForm.controls.correoCopia;
    if (marcado) {
      correoCopia.addValidators(Validators.required);
    } else {
      correoCopia.removeValidators(Validators.required);
      correoCopia.reset('', { emitEvent: false });
    }
    correoCopia.updateValueAndValidity({ emitEvent: false });
  }

  reenviar(): void {
    if (this.reenviarForm.invalid) {
      this.reenviarForm.markAllAsTouched();
      this.notify.notify('warning', this.translate.instant('facturasPe.detalle.correoInvalido'));
      return;
    }

    const raw = this.reenviarForm.getRawValue();
    this.enviando.set(true);
    this.service
      .reenviarPE({
        idPedidoEspecial: this.data.idPedidoEspecial,
        correoCopia: raw.enviarCopia ? (raw.correoCopia || null) : null,
      })
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify('success', res.mensaje ?? '');
            this.dialogRef.close(
              new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, message: res.mensaje }),
            );
          } else {
            this.notify.notify(
              'error',
              res?.mensaje ?? this.translate.instant('facturasPe.msg.reenviarFallback'),
            );
          }
        },
        error: (err) => {
          console.error('Error al reenviar factura de pedido especial', err);
          this.notify.notify('error', this.translate.instant('facturasPe.msg.reenviarError'));
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
