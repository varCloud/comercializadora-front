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
 * Pantalla de Cierre de Caja (FE-B3/FE-B5). Réplica de `Views/Ventas/CierreCajas.cshtml` +
 * `_CierreDia.cshtml`: resumen de ventas por forma de pago, cancelaciones, devoluciones,
 * retiros y saldo, más la captura de "efectivo entregado en cierre".
 *
 * **Autorización de cierre (FE-B5, adaptado al contrato real):** el legado consulta
 * `/Ventas/ObtenerConfiguracionVentas` (`RequiereAutorizacion()` en `EvtVentas.js`) ANTES de
 * decidir si abre el modal. `CajaController` (comercializadora-api) NO expone esa configuración
 * (`SP_CONSULTA_CONFIGURACION_VENTAS` es interna a `CajaService.CerrarAsync`) — por eso aquí se
 * intenta el cierre directo primero (sin credenciales); si el backend responde que hace falta un
 * autorizador (`CajaCierreRequest` sin `usuarioAutoriza`/`contrasena` cuando la config lo exige),
 * se abre {@link AutorizarCierreDialogComponent} y se reintenta con las credenciales capturadas.
 * Cuando la autorización NO es requerida, esto resuelve en una sola petición (igual que el
 * contrato documentado); cuando SÍ es requerida, son dos peticiones de cierre (la primera
 * rechazada por el servidor, la segunda con credenciales) — no hay una llamada de validación de
 * contraseña aparte, sigue siendo la MISMA petición de cierre la que valida (ver `CierreRequest`).
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
      this.realizarCierre(null);
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

  /**
   * Intenta el cierre. Si el servidor lo rechaza por falta de autorizador y todavía no se
   * capturaron credenciales, abre el diálogo y reintenta — ver nota de clase.
   */
  private realizarCierre(autorizacion: AutorizacionCierre | null): void {
    const efectivoEntregadoEnCierre = Number(this.cierreForm.value.efectivoEntregadoEnCierre ?? 0);
    const request = new CierreRequestModel({
      efectivoEntregadoEnCierre,
      usuarioAutoriza: autorizacion?.usuario ?? null,
      contrasena: autorizacion?.contrasena ?? null,
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
          } else if (!autorizacion && this.requiereAutorizador(res?.mensaje ?? null)) {
            this.abrirAutorizacion();
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

  /**
   * Detecta el mensaje que `CajaService.CerrarAsync` (comercializadora-api) regresa cuando la
   * configuración exige autorizador y no se mandaron credenciales: "Se requiere usuario y
   * contraseña de un autorizador para cerrar la caja." No hay endpoint que exponga esa bandera
   * de antemano (ver nota de clase), así que se detecta por el mensaje de rechazo.
   */
  private requiereAutorizador(mensaje: string | null): boolean {
    return !!mensaje && mensaje.toLowerCase().includes('autorizador');
  }
}
