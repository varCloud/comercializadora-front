import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ValidaApertura } from 'src/app/admin/models/ventas/valida-apertura';
import { IngresoEfectivoRequestModel } from 'src/app/admin/models/ventas/ingreso-efectivo-request';
import { TipoIngresoEfectivoId } from 'src/app/admin/models/ventas/tipo-ingreso-efectivo';
import { CajaService } from 'src/app/admin/services/caja.service';

/**
 * Pantalla de Apertura de Caja (FE-B3). Réplica de `Views/Ventas/AperturaCajas.cshtml`: la
 * apertura viaja como un Ingreso de Efectivo con `idTipoIngresoEfectivo = 1` (`_IngresoEfectivo.cshtml`).
 * Antes de mostrar el formulario, valida si la estación ya tiene una caja abierta
 * (`CajaService.validaApertura`, réplica de la validación de entrada al POS descrita en la HU).
 *
 * ⚠️ Sin integración real (FE-B5): `CajaService` está simulado (ver su cabecera). El guard que
 * redirige automáticamente a esta pantalla al entrar a Ventas sin caja abierta es parte de
 * FE-B5, no de esta tarea.
 */
@Component({
  selector: 'app-apertura-caja',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, TranslatePipe, BlockUIModule],
  templateUrl: './apertura-caja.component.html',
  styleUrl: './apertura-caja.component.scss',
})
export class AperturaCajaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cajaService = inject(CajaService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  @BlockUI('apertura-caja') blockUI!: NgBlockUI;

  readonly validacion = signal<ValidaApertura | null>(null);
  readonly guardando = signal(false);

  readonly aperturaForm = this.fb.group({
    monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    this.validar();
  }

  private validar(): void {
    this.blockUI.start(this.translate.instant('ventas.caja.apertura.msg.validando'));
    this.cajaService
      .validaApertura()
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.validacion.set(res),
        error: (err) => {
          console.error('Error al validar la apertura de caja', err);
          this.notify.notify('error', this.translate.instant('ventas.caja.apertura.msg.errorValidar'));
        },
      });
  }

  irAVentas(): void {
    this.router.navigate(['/admin/ventas']);
  }

  irACierre(): void {
    this.router.navigate(['/admin/ventas/cierre-caja']);
  }

  abrirCaja(): void {
    if (this.aperturaForm.invalid || this.guardando()) {
      this.aperturaForm.markAllAsTouched();
      return;
    }

    const monto = Number(this.aperturaForm.value.monto ?? 0);
    const request = new IngresoEfectivoRequestModel({
      monto,
      idTipoIngresoEfectivo: TipoIngresoEfectivoId.AperturaCajas,
    });

    this.guardando.set(true);
    this.blockUI.start(this.translate.instant('ventas.caja.apertura.msg.guardando'));
    this.cajaService
      .abrirCaja(request)
      .pipe(
        finalize(() => {
          this.guardando.set(false);
          this.blockUI.stop();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify(
              'success',
              res.mensaje ?? this.translate.instant('ventas.caja.apertura.msg.exito'),
            );
            this.irAVentas();
          } else {
            this.notify.notify(
              'error',
              res?.mensaje ?? this.translate.instant('ventas.caja.apertura.msg.error'),
            );
          }
        },
        error: (err) => {
          console.error('Error al abrir la caja', err);
          this.notify.notify('error', this.translate.instant('ventas.caja.apertura.msg.error'));
        },
      });
  }
}
