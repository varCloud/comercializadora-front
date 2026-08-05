import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { EMPTY_LINKS } from 'src/app/admin/models/shared/paged-result';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { RetiroEfectivoPedidoEspecial } from 'src/app/admin/models/pedidos-especiales/retiro-efectivo-pedido-especial';
import { RetiroEfectivoPedidoEspecialRequestModel } from 'src/app/admin/models/pedidos-especiales/retiro-efectivo-pedido-especial-request';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';
import { abrirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';

/**
 * Pantalla "Retiro de Efectivo" de Pedidos Especiales (FE-4, `cierre_caja_pe`). Réplica de
 * `RetirarExcesoEfectivo` + `ObtenerRetirosEfectivo` (legado, región `RetiroExcesoEfectivo` de
 * `PedidosEspecialesV2Controller`): alta de un retiro (monto) + listado de retiros ya hechos, en
 * una sola pantalla — mismo criterio que `RetiroExcesoDialogComponent` de Ventas (resumen +
 * alta + listado combinados), pero como página (Pedidos Especiales no tiene un POS del que abrir
 * un diálogo modal). El listado se pagina en el propio footer `app-paginador` (regla 10, dura).
 *
 * A diferencia de `CajaService.RetirarAsync` (Ventas), el backend de Pedidos Especiales NO
 * valida el retiro contra `efectivoDisponible` (desviación real documentada en la HU/task) — no
 * se agrega esa validación en el servidor. El legado SÍ valida en CLIENTE antes del submit
 * (`evtIngresosRetirosEfectivo.js`, hallazgo del paso 05 de verificación) — replicado aquí con
 * el mismo criterio que `RetiroExcesoDialogComponent` de Ventas (UX temprana; el tope real, si
 * alguna vez se agrega, lo valida el servidor).
 *
 * El endpoint `GET caja/retiros-efectivo` no pagina server-side (mismo caso que
 * `/api/caja/retiros` de Ventas) — se mantiene la paginación LOCAL ya implementada
 * (`setLocalPage`, mismo patrón que `RetirosIngresosComponent`).
 *
 * **Guard de caja abierta (hallazgo del paso 05 de verificación):** en el legado, Ingreso y
 * Retiro viven en el mismo partial (`_IngresosRetirosEfectivo.cshtml`), así que
 * `ValidaCajaAbierta()` siempre se dispara antes de poder ver la sección de retiro. Al separar
 * esta pantalla del ingreso (decisión de diseño de `cierre_caja_pe`), ese chequeo se perdía si el
 * usuario navegaba directo aquí — corregido consultando el signal compartido `cajaAbierta` del
 * servicio (FE-6) y bloqueando el formulario con un aviso + acceso directo a Apertura de Caja.
 */
@Component({
  selector: 'app-retiro-efectivo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    TranslatePipe,
    BlockUIModule,
    CurrencyPipe,
    DatePipe,
    PaginadorComponent,
  ],
  templateUrl: './retiro-efectivo.component.html',
})
export class RetiroEfectivoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  @BlockUI('retiro-efectivo') blockUI!: NgBlockUI;

  readonly displayedColumns = ['idRetiro', 'monto', 'usuario', 'estacion', 'fecha', 'ticket'];

  readonly guardando = signal(false);
  readonly generandoTicket = signal<number | null>(null);
  readonly efectivoDisponible = signal(0);

  /** `true` solo cuando ya se confirmó que NO hay caja abierta (evita el flash mientras carga). */
  readonly cajaCerrada = computed(() => this.service.cajaAbierta() === false);

  readonly retiroForm = this.fb.group({
    monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  // ====================== Listado (paginación local, regla 10 — ver nota de clase) ======================

  private retirosCompletos: RetiroEfectivoPedidoEspecial[] = [];
  readonly pag = new Paginador<RetiroEfectivoPedidoEspecial>(CONSTANTS.PAGINATION.PAGE_SIZE);

  ngOnInit(): void {
    this.cargarRetiros();
    this.cargarEfectivoDisponible();
    this.service.refrescarCajaAbierta().subscribe({
      error: (err) => console.error('Error al validar la caja abierta de Pedidos Especiales', err),
    });
  }

  /** Botón del aviso de "caja cerrada" — misma ruta que usa `CierreCajaComponent.continuar()`. */
  irAApertura(): void {
    this.router.navigate(['/admin/pedidos-especiales/apertura-ingreso-efectivo']);
  }

  private cargarEfectivoDisponible(): void {
    this.service.obtenerInfoCierre().subscribe({
      next: (info) => this.efectivoDisponible.set(info.efectivoDisponible),
      error: (err) => {
        console.error('Error al consultar el efectivo disponible de Pedidos Especiales', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.retiro.msg.errorDisponible'));
      },
    });
  }

  private cargarRetiros(): void {
    this.blockUI.start(this.translate.instant('pedidosEspeciales.caja.retiro.msg.cargandoListado'));
    this.service
      .obtenerRetirosEfectivo()
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (retiros) => {
          this.retirosCompletos = retiros;
          this.setLocalPage(1);
        },
        error: (err) => {
          console.error('Error al consultar el listado de retiros de Pedidos Especiales', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.retiro.msg.errorListado'));
        },
      });
  }

  retirar(): void {
    if (this.retiroForm.invalid || this.guardando() || this.cajaCerrada()) {
      this.retiroForm.markAllAsTouched();
      return;
    }

    const monto = Number(this.retiroForm.value.monto ?? 0);
    const disponible = this.efectivoDisponible();

    // Validación en cliente (UX temprana, replica al legado); el servidor no valida tope (regla real documentada).
    if (monto > disponible) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.caja.retiro.msg.excedeDisponible', {
          disponible: disponible.toFixed(2),
        }),
      );
      return;
    }

    const request = new RetiroEfectivoPedidoEspecialRequestModel({ monto });

    this.guardando.set(true);
    this.blockUI.start(this.translate.instant('pedidosEspeciales.caja.retiro.msg.guardando'));
    this.service
      .registrarRetiroEfectivo(request)
      .pipe(
        finalize(() => {
          this.guardando.set(false);
          this.blockUI.stop();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify('success', res.mensaje ?? this.translate.instant('pedidosEspeciales.caja.retiro.msg.exito'));
            this.retiroForm.reset();
            this.cargarRetiros();
            this.cargarEfectivoDisponible();
          } else {
            this.notify.notify('error', res?.mensaje ?? this.translate.instant('pedidosEspeciales.caja.retiro.msg.error'));
          }
        },
        error: (err) => {
          console.error('Error al registrar el retiro de efectivo de Pedidos Especiales', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.retiro.msg.error'));
        },
      });
  }

  /** "Ver ticket" del retiro de la fila (comprobante PDF). */
  verTicket(retiro: RetiroEfectivoPedidoEspecial): void {
    if (this.generandoTicket()) return;

    this.generandoTicket.set(retiro.idRetiro);
    this.service
      .obtenerTicketRetiroEfectivo(retiro.idRetiro)
      .pipe(finalize(() => this.generandoTicket.set(null)))
      .subscribe({
        next: (blob) => abrirPdfBlob(blob),
        error: (err) => {
          console.error('Error al generar el ticket PDF del retiro de efectivo', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.retiro.msg.errorTicket'));
        },
      });
  }

  // ====================== Paginación local ======================

  navegar(pagina: string): void {
    this.setLocalPage(parseInt(pagina, 10) || 1);
  }

  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.setLocalPage(1);
  }

  /** Corta la página `pagina` de la lista en memoria y sintetiza links/meta del paginador. */
  private setLocalPage(pagina: number): void {
    const lista = this.retirosCompletos;
    const perPage = this.pag.perPage();
    const total = lista.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(1, pagina), lastPage);
    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);

    this.pag.setPage({
      data: lista.slice(from - 1, to),
      links: {
        ...EMPTY_LINKS,
        first: page > 1 ? '1' : null,
        prev: page > 1 ? String(page - 1) : null,
        next: page < lastPage ? String(page + 1) : null,
        last: page < lastPage ? String(lastPage) : null,
      },
      meta: { currentPage: page, from, lastPage, path: '', perPage, to, total },
    });
  }
}
