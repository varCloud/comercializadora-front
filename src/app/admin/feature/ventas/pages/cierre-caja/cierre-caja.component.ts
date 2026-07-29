import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { CajaInfo } from 'src/app/admin/models/ventas/caja-info';
import { CierreRequestModel } from 'src/app/admin/models/ventas/cierre-request';
import { CajaService } from 'src/app/admin/services/caja.service';
import {
  AutorizacionCierre,
  AutorizarCierreDialogComponent,
} from '../../components/autorizar-cierre-dialog/autorizar-cierre-dialog.component';

/**
 * Pantalla de Cierre de Caja (FE-B3). Réplica de `Views/Ventas/CierreCajas.cshtml` +
 * `_CierreDia.cshtml`: resumen de ventas por forma de pago, cancelaciones, devoluciones,
 * retiros y saldo, más la captura de "efectivo entregado en cierre". Si la configuración exige
 * autorización (`ValidaApertura.requiereAutorizacionCierre`), abre
 * {@link AutorizarCierreDialogComponent} antes de cerrar — réplica de
 * `RequiereAutorizacion()`/`ModalAutorizarCierre()` de `EvtVentas.js`, adaptada al contrato
 * nuevo donde usuario/contraseña viajan en la MISMA petición de cierre (ver `CierreRequest`).
 *
 * ⚠️ Sin integración real (FE-B5): `CajaService` está simulado (ver su cabecera).
 */
@Component({
  selector: 'app-cierre-caja',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    TranslatePipe,
    BlockUIModule,
    CurrencyPipe,
  ],
  templateUrl: './cierre-caja.component.html',
})
export class CierreCajaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cajaService = inject(CajaService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  @BlockUI('cierre-caja') blockUI!: NgBlockUI;

  readonly cajaInfo = signal<CajaInfo | null>(null);
  readonly requiereAutorizacion = signal(true);
  readonly guardando = signal(false);

  readonly cierreForm = this.fb.group({
    efectivoEntregadoEnCierre: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.blockUI.start(this.translate.instant('ventas.caja.cierre.msg.cargando'));
    this.cajaService
      .obtenerInfoCierre()
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.cajaInfo.set(res),
        error: (err) => {
          console.error('Error al consultar el resumen de cierre', err);
          this.notify.notify('error', this.translate.instant('ventas.caja.cierre.msg.errorCargar'));
        },
      });

    this.cajaService.validaApertura().subscribe({
      next: (res) => this.requiereAutorizacion.set(res.requiereAutorizacionCierre),
      error: (err) => console.error('Error al consultar la configuración de cierre', err),
    });
  }

  /** Botón "Realizar cierre": confirma, valida autorización si aplica y cierra. */
  confirmarCierre(): void {
    if (this.cierreForm.invalid || this.guardando()) {
      this.cierreForm.markAllAsTouched();
      this.notify.notify('warning', this.translate.instant('ventas.caja.cierre.msg.montoRequerido'));
      return;
    }

    Swal.fire({
      title: '',
      text: this.translate.instant('ventas.caja.cierre.confirm.text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('ventas.caja.cierre.confirm.accept'),
      cancelButtonText: this.translate.instant('ventas.caja.cierre.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;

      if (this.requiereAutorizacion()) {
        this.abrirAutorizacion();
      } else {
        this.realizarCierre(null);
      }
    });
  }

  private abrirAutorizacion(): void {
    const ref = this.dialog.open(AutorizarCierreDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true,
    });

    ref.afterClosed().subscribe((res: ResultModalModel) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) {
        this.realizarCierre(res.data as AutorizacionCierre);
      }
    });
  }

  private realizarCierre(autorizacion: AutorizacionCierre | null): void {
    const efectivoEntregadoEnCierre = Number(this.cierreForm.value.efectivoEntregadoEnCierre ?? 0);
    const request = new CierreRequestModel({
      efectivoEntregadoEnCierre,
      usuarioAutoriza: autorizacion?.usuario ?? null,
      password: autorizacion?.password ?? null,
    });

    this.guardando.set(true);
    this.blockUI.start(this.translate.instant('ventas.caja.cierre.msg.guardando'));
    this.cajaService
      .cerrarCaja(request)
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
              res.mensaje ?? this.translate.instant('ventas.caja.cierre.msg.exito'),
            );
            this.router.navigate(['/admin/ventas/apertura-caja']);
          } else {
            this.notify.notify(
              'error',
              res?.mensaje ?? this.translate.instant('ventas.caja.cierre.msg.error'),
            );
          }
        },
        error: (err) => {
          console.error('Error al realizar el cierre de caja', err);
          this.notify.notify('error', this.translate.instant('ventas.caja.cierre.msg.error'));
        },
      });
  }
}
