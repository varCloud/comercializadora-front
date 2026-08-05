import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { IngresoEfectivoPedidoEspecialRequestModel } from 'src/app/admin/models/pedidos-especiales/ingreso-efectivo-pedido-especial-request';
import { TipoIngresoPedidoEspecialId } from 'src/app/admin/models/pedidos-especiales/tipo-ingreso-pedido-especial';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';
import { abrirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';

/**
 * Pantalla "Apertura de Caja / Ingreso de Efectivo" de Pedidos Especiales (FE-3, `cierre_caja_pe`).
 * Réplica de la acción `IngresoEfectivo` (legado, región `IngresoEfectivo` de
 * `PedidosEspecialesV2Controller`): **un único formulario** cubre tanto la apertura de caja
 * (`idTipoIngreso = 1`) como el ingreso de efectivo normal durante el turno (`idTipoIngreso = 2`)
 * — la HU es explícita en que el legado usa una sola pantalla/endpoint para ambos casos, así que
 * aquí tampoco se crean dos componentes separados (ver `apertura-caja` + `ingreso-efectivo-dialog`
 * de Ventas, que SÍ están separados porque el legado de Ventas los separa; Pedidos Especiales no).
 *
 * El caso (apertura vs. ingreso) se determina por `cajaAbierta()` (signal compartido del
 * servicio, FE-6): si la estación NO tiene caja abierta, el formulario se comporta como
 * "Apertura de Caja"; si ya la tiene, como "Ingreso de Efectivo".
 *
 * FE-6: no hay redirección forzosa si no hay caja abierta — se permite navegar directo a esta
 * pantalla (supuesto documentado en `task_cierre_caja_pe.md`, el legado no aclara un guard
 * explícito de entrada al módulo).
 */
@Component({
  selector: 'app-apertura-ingreso-efectivo',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, TranslatePipe, BlockUIModule],
  templateUrl: './apertura-ingreso-efectivo.component.html',
})
export class AperturaIngresoEfectivoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('apertura-ingreso-efectivo') blockUI!: NgBlockUI;

  /** Estado compartido de caja abierta (servicio, FE-6). `null` = todavía no se consultó. */
  readonly cajaAbierta = computed(() => this.service.cajaAbierta() === true);
  readonly guardando = signal(false);
  readonly ultimoIngresoId = signal<number | null>(null);
  readonly generandoTicket = signal(false);

  readonly tipoIngreso = computed(() =>
    this.cajaAbierta() ? TipoIngresoPedidoEspecialId.IngresoEfectivo : TipoIngresoPedidoEspecialId.AperturaCaja,
  );

  readonly esApertura = computed(() => this.tipoIngreso() === TipoIngresoPedidoEspecialId.AperturaCaja);

  readonly ingresoForm = this.fb.group({
    monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    this.service.refrescarCajaAbierta().subscribe({
      error: (err) => console.error('Error al validar la caja abierta de Pedidos Especiales', err),
    });
  }

  guardar(): void {
    if (this.ingresoForm.invalid || this.guardando()) {
      this.ingresoForm.markAllAsTouched();
      return;
    }

    const monto = Number(this.ingresoForm.value.monto ?? 0);
    const request = new IngresoEfectivoPedidoEspecialRequestModel({
      monto,
      idTipoIngreso: this.tipoIngreso(),
    });

    this.guardando.set(true);
    this.blockUI.start(this.translate.instant('pedidosEspeciales.caja.ingreso.msg.guardando'));
    this.service
      .guardarIngresoEfectivo(request)
      .pipe(
        finalize(() => {
          this.guardando.set(false);
          this.blockUI.stop();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify('success', res.mensaje ?? this.translate.instant('pedidosEspeciales.caja.ingreso.msg.exito'));
            if (this.esApertura()) this.service.marcarCajaAbierta();
            this.ultimoIngresoId.set(res.modelo ?? null);
            this.ingresoForm.reset();
          } else {
            this.notify.notify('error', res?.mensaje ?? this.translate.instant('pedidosEspeciales.caja.ingreso.msg.error'));
          }
        },
        error: (err) => {
          console.error('Error al registrar ingreso/apertura de caja de Pedidos Especiales', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.ingreso.msg.error'));
        },
      });
  }

  /** "Ver ticket" del último ingreso/apertura registrado (ver `ultimoIngresoId`). */
  verTicket(): void {
    const id = this.ultimoIngresoId();
    if (!id || this.generandoTicket()) return;

    this.generandoTicket.set(true);
    this.service
      .obtenerTicketIngresoEfectivo(id)
      .pipe(finalize(() => this.generandoTicket.set(false)))
      .subscribe({
        next: (blob) => abrirPdfBlob(blob),
        error: (err) => {
          console.error('Error al generar el ticket PDF del ingreso de efectivo', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.ingreso.msg.errorTicket'));
        },
      });
  }
}
