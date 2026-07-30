import { CurrencyPipe, DatePipe, formatDate } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { CajaInfo } from 'src/app/admin/models/ventas/caja-info';
import { Retiro } from 'src/app/admin/models/ventas/retiro';
import { TipoRetiroId } from 'src/app/admin/models/ventas/tipo-retiro';
import { RetiroRequestModel } from 'src/app/admin/models/ventas/retiro-request';
import { CajaService } from 'src/app/admin/services/caja.service';
import { abrirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';

/**
 * Diálogo "Cierre de Caja por Exceso de Efectivo" del POS (réplica de `#ModalCierreExceso` de
 * `Ventas.cshtml` + `AbrirModalCierreCajaExcedentes()`/`retirarExcesoEfectivo()` de
 * `EvtVentas.js`): resumen de caja (`ConsultaInfoCierre`) a la izquierda, monto a retirar +
 * botón a la derecha, y debajo el listado de retiros por exceso YA hechos hoy en esta estación
 * (`ConsultRetiros` → `_ObtenerRetiros.cshtml`, sin paginación ni filtros — solo hoy).
 * Al retirar con éxito, el legado imprime el ticket y cierra el modal de inmediato.
 */
@Component({
  selector: 'app-retiro-exceso-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    TranslatePipe,
    BlockUIModule,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './retiro-exceso-dialog.component.html',
})
export class RetiroExcesoDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cajaService = inject(CajaService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<RetiroExcesoDialogComponent>);

  @BlockUI('retiroExcesoDialog') blockUI!: NgBlockUI;

  readonly displayedColumns = ['idRetiro', 'monto', 'usuario', 'estacion', 'fecha', 'reimprimir'];

  readonly cajaInfo = signal<CajaInfo | null>(null);
  readonly retirosHoy = signal<Retiro[]>([]);
  readonly guardando = signal(false);
  readonly generandoTicket = signal<number | null>(null);

  /** El backend ya regresa `efectivoDisponible` neto de los retiros del día (mismo criterio que `RetirosIngresosComponent`). */
  readonly disponibleParaRetirar = computed(() => {
    const info = this.cajaInfo();
    return info ? Math.max(0, info.efectivoDisponible) : 0;
  });

  readonly retiroForm = this.fb.group({
    monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    this.cargarInfo();
    this.cargarRetirosHoy();
  }

  private cargarInfo(): void {
    this.cajaService.obtenerInfoCierre().subscribe({
      next: (res) => this.cajaInfo.set(res),
      error: (err) => console.error('Error al consultar el resumen de caja', err),
    });
  }

  private cargarRetirosHoy(): void {
    const hoy = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
    this.blockUI.start(this.translate.instant('ventas.caja.retiroExcesoDialog.msg.cargando'));
    this.cajaService
      .obtenerRetiros({ idTipoRetiro: TipoRetiroId.ExcesoEfectivo, fecha: hoy })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.retirosHoy.set(res),
        error: (err) => console.error('Error al consultar los retiros del día', err),
      });
  }

  retirar(): void {
    if (this.retiroForm.invalid || this.guardando()) {
      this.retiroForm.markAllAsTouched();
      return;
    }

    const monto = Number(this.retiroForm.value.monto ?? 0);
    const disponible = this.disponibleParaRetirar();

    // Validación en cliente (UX temprana); el tope real lo valida el servidor.
    if (monto > disponible) {
      this.notify.notify(
        'warning',
        this.translate.instant('ventas.caja.retiro.msg.excedeDisponible', {
          disponible: disponible.toFixed(2),
        }),
      );
      return;
    }

    this.guardando.set(true);
    this.blockUI.start(this.translate.instant('ventas.caja.retiro.msg.guardando'));
    this.cajaService
      .registrarRetiro(new RetiroRequestModel({ monto }))
      .pipe(
        finalize(() => {
          this.guardando.set(false);
          this.blockUI.stop();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify('success', res.mensaje ?? this.translate.instant('ventas.caja.retiro.msg.exito'));
            const idRetiro = res.modelo ?? null;
            this.dialogRef.close();
            if (idRetiro) this.imprimirTicket(idRetiro);
          } else {
            this.notify.notify('error', res?.mensaje ?? this.translate.instant('ventas.caja.retiro.msg.error'));
          }
        },
        error: (err) => {
          console.error('Error al registrar el retiro por exceso de efectivo', err);
          this.notify.notify('error', this.translate.instant('ventas.caja.retiro.msg.error'));
        },
      });
  }

  /** "Reimprimir" de una fila del listado de retiros de hoy. */
  reimprimir(retiro: Retiro): void {
    this.imprimirTicket(retiro.idRetiro);
  }

  private imprimirTicket(idRetiro: number): void {
    this.generandoTicket.set(idRetiro);
    this.cajaService
      .obtenerTicketPdf(idRetiro, 'retiro')
      .pipe(finalize(() => this.generandoTicket.set(null)))
      .subscribe({
        next: (blob) => abrirPdfBlob(blob),
        error: (err) => console.error('Error al generar el ticket PDF del retiro', err),
      });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
