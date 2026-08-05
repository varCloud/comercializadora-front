import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { CierrePedidoEspecialDetalle } from 'src/app/admin/models/pedidos-especiales/cierre-pedido-especial-detalle';
import { CierrePedidoEspecialRequestModel } from 'src/app/admin/models/pedidos-especiales/cierre-pedido-especial-request';
import { TipoConfiguracionPedidoEspecialId } from 'src/app/admin/models/pedidos-especiales/tipo-configuracion-pedido-especial';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';
import { abrirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';
import {
  AutorizacionCierrePe,
  AutorizarCierrePeDialogComponent,
} from '../../components/autorizar-cierre-pe-dialog/autorizar-cierre-pe-dialog.component';

/**
 * Página "Cierre de Caja" de Pedidos Especiales (FE-5, `cierre_caja_pe`). Réplica de
 * `CierreCajas`/`RealizaCierreEstacion` (legado, región `CierreCajas` de
 * `PedidosEspecialesV2Controller`): resumen del día previo al cierre + captura de "efectivo
 * entregado en cierre" + cierre, con autorización condicional.
 *
 * `GET caja/cierre-dia` (`obtenerCierreDia`) regresa una fila por categoría/almacén con los
 * campos de encabezado del cierre repetidos en cada fila (mismo criterio denormalizado que el
 * legado, que recorre `Modelo[0]` para el encabezado y `Modelo[i]` para las líneas) — aquí se
 * toma `lineas()[0]` como encabezado del resumen y se listan todas las filas como detalle por
 * categoría.
 *
 * **Autorización de cierre:** a diferencia de Ventas (que detecta la necesidad de autorizador
 * reactivamente, por el mensaje de rechazo del backend), aquí la configuración
 * `RequiereAutCierre` (propia de Pedidos Especiales, `idConfig=2`) se consulta PROACTIVAMENTE al
 * cargar la pantalla — si `activo && valor === 1`, el botón de cierre abre
 * {@link AutorizarCierrePeDialogComponent} (que ya valida usuario/contraseña contra
 * `caja/validar-usuario`) antes de llamar a `caja/cerrar`.
 *
 * El detalle por categoría es una tabla ACOTADA a las líneas del cierre del día (no un catálogo
 * que crezca sin límite) — mismo criterio que "Ver Detalle" de un pedido especial
 * (`PedidoEspecialDetalleDialogComponent`) o el resumen de `CierreDiaDialogComponent` (Ventas):
 * no aplica la paginación server-side obligatoria de la regla 10 (pensada para listados/catálogos
 * que crecen), así que no lleva `app-paginador`. Supuesto documentado en `task_cierre_caja_pe.md`.
 */
@Component({
  selector: 'app-cierre-caja',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, TranslatePipe, BlockUIModule, CurrencyPipe],
  templateUrl: './cierre-caja.component.html',
})
export class CierreCajaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PedidosEspecialesService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  @BlockUI('cierreCaja') blockUI!: NgBlockUI;

  readonly lineas = signal<CierrePedidoEspecialDetalle[]>([]);
  readonly encabezado = computed<CierrePedidoEspecialDetalle | null>(() => this.lineas()[0] ?? null);
  readonly requiereAutorizacion = signal(false);
  readonly guardando = signal(false);
  readonly cargado = signal(false);

  readonly cierreExitoso = signal(false);
  readonly ultimoCierreId = signal<number | null>(null);
  readonly generandoTicket = signal(false);

  readonly cierreForm = this.fb.group({
    efectivoEntregadoEnCierre: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.cargar();
    this.cargarConfiguracion();
  }

  private cargar(): void {
    this.blockUI.start(this.translate.instant('pedidosEspeciales.caja.cierre.msg.cargando'));
    this.service
      .obtenerCierreDia()
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (lineas) => {
          this.lineas.set(lineas);
          this.cargado.set(true);
        },
        error: (err) => {
          console.error('Error al consultar el resumen de cierre de Pedidos Especiales', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.cierre.msg.errorCargar'));
          this.cargado.set(true);
        },
      });
  }

  private cargarConfiguracion(): void {
    this.service.obtenerConfiguracion(TipoConfiguracionPedidoEspecialId.RequiereAutCierre).subscribe({
      next: (configuraciones) => {
        const config = configuraciones[0];
        this.requiereAutorizacion.set(!!config && config.activo && config.valor === 1);
      },
      error: (err) => console.error('Error al consultar la configuración de autorización de cierre', err),
    });
  }

  /** Botón "Realizar cierre": confirma, valida autorización si aplica y cierra. */
  confirmarCierre(): void {
    if (this.cierreForm.invalid || this.guardando()) {
      this.cierreForm.markAllAsTouched();
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.caja.cierre.msg.montoRequerido'));
      return;
    }

    Swal.fire({
      title: '',
      text: this.translate.instant('pedidosEspeciales.caja.cierre.confirm.text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('pedidosEspeciales.caja.cierre.confirm.accept'),
      cancelButtonText: this.translate.instant('pedidosEspeciales.caja.cierre.confirm.cancel'),
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
    const ref = this.dialog.open(AutorizarCierrePeDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true,
    });

    ref.afterClosed().subscribe((res: ResultModalModel) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) {
        this.realizarCierre(res.data as AutorizacionCierrePe);
      }
    });
  }

  private realizarCierre(autorizacion: AutorizacionCierrePe | null): void {
    const efectivoEntregadoEnCierre = Number(this.cierreForm.value.efectivoEntregadoEnCierre ?? 0);
    const request = new CierrePedidoEspecialRequestModel({
      efectivoEntregadoEnCierre,
      usuarioAutoriza: autorizacion?.usuario ?? null,
      contrasena: autorizacion?.contrasena ?? null,
    });

    this.guardando.set(true);
    this.blockUI.start(this.translate.instant('pedidosEspeciales.caja.cierre.msg.guardando'));
    this.service
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
            this.notify.notify('success', res.mensaje ?? this.translate.instant('pedidosEspeciales.caja.cierre.msg.exito'));
            this.cierreExitoso.set(true);
            this.releerIdCierre();
          } else {
            this.notify.notify('error', res?.mensaje ?? this.translate.instant('pedidosEspeciales.caja.cierre.msg.error'));
          }
        },
        error: (err) => {
          console.error('Error al realizar el cierre de caja de Pedidos Especiales', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.cierre.msg.error'));
        },
      });
  }

  /**
   * El SP de cierre no regresa el id del cierre — se relee `cierre-dia` tras un cierre exitoso
   * para obtener `idCierrePedidoEspecial` y poder ofrecer el ticket (nota del contrato de la HU).
   */
  private releerIdCierre(): void {
    this.service.obtenerCierreDia().subscribe({
      next: (lineas) => this.ultimoCierreId.set(lineas[0]?.idCierrePedidoEspecial ?? null),
      error: (err) => console.error('Error al releer el id del cierre para el ticket', err),
    });
  }

  /** "Ver ticket" del cierre recién realizado (ver `ultimoCierreId`). */
  verTicketCierre(): void {
    const id = this.ultimoCierreId();
    if (!id || this.generandoTicket()) return;

    this.generandoTicket.set(true);
    this.service
      .obtenerTicketCierre(id)
      .pipe(finalize(() => this.generandoTicket.set(false)))
      .subscribe({
        next: (blob) => abrirPdfBlob(blob),
        error: (err) => {
          console.error('Error al generar el ticket PDF del cierre de Pedidos Especiales', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.cierre.msg.errorTicket'));
        },
      });
  }

  /** Tras el cierre, la caja ya no está abierta: navega a Apertura de Caja / Ingreso de Efectivo. */
  continuar(): void {
    this.router.navigate(['/admin/pedidos-especiales/apertura-ingreso-efectivo']);
  }
}
