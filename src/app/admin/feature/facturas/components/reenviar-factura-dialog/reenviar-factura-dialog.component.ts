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

/** Datos de apertura del diálogo: la venta a reenviar y el total CON impuestos de la fila
 *  (el detalle del back trae el total SIN IVA, ver nota en DetalleVentaFactura). */
export interface ReenviarFacturaData {
  idVenta: number;
  montoTotal: number;
}

/**
 * Diálogo "Reenviar factura": muestra el detalle de la venta (cliente, forma de pago, uso CFDI,
 * totales) y permite reenviar el CFDI (PDF+XML) por correo, con copia opcional a un correo
 * adicional (checkbox + validación de email, igual que el legado ModalFactura/EvtFacturas.js).
 */
@Component({
  selector: 'app-reenviar-factura-dialog',
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
  templateUrl: './reenviar-factura-dialog.component.html',
  styleUrl: './reenviar-factura-dialog.component.scss',
})
export class ReenviarFacturaDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(FacturasService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<ReenviarFacturaDialogComponent>);
  readonly data = inject<ReenviarFacturaData>(MAT_DIALOG_DATA);

  @BlockUI('reenviarFactura') blockUI!: NgBlockUI;

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
      .obtenerDetalle(this.data.idVenta)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (detalle) => {
          this.detalle.set(detalle);
          this.cargado.set(true);
        },
        error: (err) => {
          console.error('Error al cargar el detalle de la venta', err);
          this.notify.notify('error', this.translate.instant('facturas.detalle.loadError'));
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
      this.notify.notify('warning', this.translate.instant('facturas.detalle.correoInvalido'));
      return;
    }

    const raw = this.reenviarForm.getRawValue();
    this.enviando.set(true);
    this.service
      .reenviar({
        idVenta: this.data.idVenta,
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
              res?.mensaje ?? this.translate.instant('facturas.msg.reenviarFallback'),
            );
          }
        },
        error: (err) => {
          console.error('Error al reenviar factura', err);
          this.notify.notify('error', this.translate.instant('facturas.msg.reenviarError'));
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
