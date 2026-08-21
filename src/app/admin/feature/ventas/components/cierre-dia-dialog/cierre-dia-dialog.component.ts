import { CurrencyPipe, DatePipe, formatDate } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
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
import { Retiro } from 'src/app/admin/models/ventas/retiro';
import { TipoRetiroId } from 'src/app/admin/models/ventas/tipo-retiro';
import { CajaService } from 'src/app/admin/services/caja.service';
import { abrirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';
import {
  AutorizacionCierre,
  AutorizarCierreDialogComponent,
} from '../autorizar-cierre-dialog/autorizar-cierre-dialog.component';

/**
 * Diálogo "Cierre de Caja fin de Día" del POS (réplica de `#ModalCierre` de `Ventas.cshtml` +
 * `_CierreDia.cshtml`, `AbrirModalCierreDia()`/`HacerCierre()` de `EvtVentas.js`): igual que
 * "Consultar Existencias"/"Ingreso de Efectivo"/"Retiro de Exceso", el legado lo abre como modal
 * DENTRO de la propia vista de ventas, nunca navegando a otra pantalla — antes era una pantalla
 * ruteada aparte (`/admin/ventas/cierre-caja`), ahora vive aquí.
 *
 * **Autorización de cierre:** el legado consulta `/Ventas/ObtenerConfiguracionVentas`
 * (`RequiereAutorizacion()`) ANTES de decidir si abre el modal de autorización.
 * `CajaController` (comercializadora-api) no expone esa configuración por separado — por eso se
 * intenta el cierre directo primero (sin credenciales); si el backend responde que hace falta un
 * autorizador, se abre {@link AutorizarCierreDialogComponent} y se reintenta con las credenciales
 * capturadas.
 */
@Component({
  selector: 'app-cierre-dia-dialog',
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
  templateUrl: './cierre-dia-dialog.component.html',
})
export class CierreDiaDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cajaService = inject(CajaService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<CierreDiaDialogComponent>);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  @BlockUI('cierreDiaDialog') blockUI!: NgBlockUI;

  /** Réplica de `_CierreDia.cshtml:10-51`: para comparar `tipoRetiro` en el template. */
  readonly TipoRetiroId = TipoRetiroId;

  readonly cajaInfo = signal<CajaInfo | null>(null);
  readonly guardando = signal(false);

  /**
   * Listado "Retiros del Día" del propio modal de cierre (P-04, réplica de `_CierreDia.cshtml:
   * 10-51`): todos los retiros de HOY en esta estación (Cierre de día + Exceso de Efectivo, sin
   * filtrar por tipo — a diferencia de `RetiroExcesoDialogComponent`, que solo lista los de
   * exceso), cada uno con botón "Reimprimir Ticket" que reutiliza el mismo mecanismo de PDF
   * (`abrirPdfBlob`) ya usado ahí.
   */
  readonly retirosHoy = signal<Retiro[]>([]);
  readonly generandoTicketRetiro = signal<number | null>(null);
  readonly displayedColumnsRetiros = ['usuario', 'fecha', 'monto', 'tipo', 'reimprimir'];

  /**
   * Tras un cierre exitoso, en vez de cerrar el modal de inmediato se muestra un resumen con el
   * botón "Ver ticket" — de otro modo el ticket del cierre sería inalcanzable. `continuar()`
   * cierra el diálogo y navega a Apertura de caja (la estación ya no tiene caja abierta).
   */
  readonly cierreExitoso = signal(false);
  readonly ultimoCierreId = signal<number | null>(null);
  readonly generandoTicket = signal(false);

  readonly cierreForm = this.fb.group({
    efectivoEntregadoEnCierre: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.cargar();
    this.cargarRetirosHoy();
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

  /** Retiros de HOY en esta estación, sin filtrar por tipo (ver comentario de `retirosHoy`). */
  private cargarRetirosHoy(): void {
    const hoy = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
    this.cajaService.obtenerRetiros({ fecha: hoy }).subscribe({
      next: (res) => this.retirosHoy.set(res),
      error: (err) => console.error('Error al consultar los retiros del día', err),
    });
  }

  /** "Reimprimir Ticket" de una fila del listado de retiros de hoy (P-04). */
  reimprimirRetiro(retiro: Retiro): void {
    if (this.generandoTicketRetiro()) return;

    this.generandoTicketRetiro.set(retiro.idRetiro);
    this.cajaService
      .obtenerTicketPdf(retiro.idRetiro, 'retiro')
      .pipe(finalize(() => this.generandoTicketRetiro.set(null)))
      .subscribe({
        next: (blob) => abrirPdfBlob(blob),
        error: (err) => console.error('Error al generar el ticket PDF del retiro', err),
      });
  }

  /** Botón "Hacer Cierre de Día": confirma, valida autorización si aplica y cierra. */
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
            this.ultimoCierreId.set(res.modelo ?? null);
            this.cierreExitoso.set(true);
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

  /** "Ver ticket" del cierre recién realizado (ver `ultimoCierreId`). */
  verTicketCierre(): void {
    const id = this.ultimoCierreId();
    if (!id || this.generandoTicket()) return;

    this.generandoTicket.set(true);
    this.cajaService
      .obtenerTicketPdf(id, 'cierre')
      .pipe(finalize(() => this.generandoTicket.set(false)))
      .subscribe({
        next: (blob) => abrirPdfBlob(blob),
        error: (err) => {
          console.error('Error al generar el ticket PDF del cierre', err);
          this.notify.notify('error', this.translate.instant('ventas.caja.cierre.msg.errorTicket'));
        },
      });
  }

  /** Cierra el diálogo y navega a Apertura de caja (la estación ya no tiene caja abierta). */
  continuar(): void {
    this.dialogRef.close();
    this.router.navigate(['/admin/ventas/apertura-caja']);
  }

  cerrar(): void {
    this.dialogRef.close();
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
