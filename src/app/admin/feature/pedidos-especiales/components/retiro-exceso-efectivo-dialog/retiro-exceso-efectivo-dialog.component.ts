import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { EMPTY_LINKS } from 'src/app/admin/models/shared/paged-result';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { InfoCierrePedidoEspecial, InfoCierrePedidoEspecialModel } from 'src/app/admin/models/pedidos-especiales/info-cierre-pedido-especial';
import { RetiroEfectivoPedidoEspecial } from 'src/app/admin/models/pedidos-especiales/retiro-efectivo-pedido-especial';
import { RetiroEfectivoPedidoEspecialRequestModel } from 'src/app/admin/models/pedidos-especiales/retiro-efectivo-pedido-especial-request';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';
import { imprimirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';

/**
 * Modal "Retiro por exceso de efectivo" — réplica de `AbrirModalRetiroExcesoEfectivo()`
 * (`evtIngresosRetirosEfectivo.js:160-165`) y de `#ModalRetiroExcesoEfectivo`: resumen de caja,
 * monto con tope validado en cliente y pestaña "Retiros del día".
 *
 * Convive con la página `RetiroEfectivoComponent` (que tiene su entrada de menú): este modal
 * existe porque el legado retira sin salir del pedido en curso, y navegar perdería el ticket.
 */
@Component({
  selector: 'app-retiro-exceso-efectivo-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    TranslatePipe,
    CurrencyPipe,
    DatePipe,
    PaginadorComponent,
  ],
  templateUrl: './retiro-exceso-efectivo-dialog.component.html',
})
export class RetiroExcesoEfectivoDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<RetiroExcesoEfectivoDialogComponent>);

  readonly displayedColumns = ['idRetiro', 'monto', 'usuario', 'estacion', 'fecha', 'ticket'];

  readonly info = signal<InfoCierrePedidoEspecial>(new InfoCierrePedidoEspecialModel());
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly generandoTicket = signal<number | null>(null);
  /** true si al menos un retiro se registró: el que abrió el modal refresca lo que dependa de caja. */
  private huboRetiro = false;

  readonly retiroForm = this.fb.group({
    monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  private retirosCompletos: RetiroEfectivoPedidoEspecial[] = [];
  readonly pag = new Paginador<RetiroEfectivoPedidoEspecial>(CONSTANTS.PAGINATION.PAGE_SIZE);

  ngOnInit(): void {
    this.cargarInfo();
    this.cargarRetiros();
  }

  private cargarInfo(): void {
    this.service.obtenerInfoCierre().subscribe({
      next: (info) => this.info.set(info),
      error: (err) => {
        console.error('Error al consultar el resumen de caja de Pedidos Especiales', err);
        this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.retiroDialog.msg.errorDisponible'));
      },
    });
  }

  private cargarRetiros(): void {
    this.cargando.set(true);
    this.service
      .obtenerRetirosEfectivo()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (retiros) => {
          this.retirosCompletos = retiros;
          this.setLocalPage(1);
        },
        error: (err) => {
          console.error('Error al consultar el listado de retiros de Pedidos Especiales', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.retiroDialog.msg.errorListado'));
        },
      });
  }

  retirar(): void {
    if (this.guardando()) return;

    if (this.retiroForm.invalid) {
      this.retiroForm.markAllAsTouched();
      this.notify.notify('warning', this.translate.instant('pedidosEspeciales.caja.retiroDialog.msg.montoRequerido'));
      return;
    }

    const monto = Number(this.retiroForm.value.monto ?? 0);
    const disponible = this.info().efectivoDisponible;

    // Tope validado en cliente igual que el legado (el backend de PE no lo valida, ver HU).
    if (monto > disponible) {
      this.notify.notify(
        'warning',
        this.translate.instant('pedidosEspeciales.caja.retiroDialog.msg.excedeDisponible', {
          disponible: disponible.toFixed(2),
        }),
      );
      return;
    }

    this.guardando.set(true);
    this.service
      .registrarRetiroEfectivo(new RetiroEfectivoPedidoEspecialRequestModel({ monto }))
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.huboRetiro = true;
            this.notify.notify('success', res.mensaje ?? this.translate.instant('pedidosEspeciales.caja.retiroDialog.msg.exito'));
            if (res.modelo) this.imprimirTicket(res.modelo);
            this.retiroForm.reset();
            this.cargarInfo();
            this.cargarRetiros();
          } else {
            this.notify.notify('error', res?.mensaje ?? this.translate.instant('pedidosEspeciales.caja.retiroDialog.msg.error'));
          }
        },
        error: (err) => {
          console.error('Error al registrar el retiro de efectivo de Pedidos Especiales', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.retiroDialog.msg.error'));
        },
      });
  }

  /** Reimpresión del ticket de un retiro (columna "Reimprimir" del legado). */
  verTicket(idRetiro: number): void {
    if (this.generandoTicket()) return;

    this.generandoTicket.set(idRetiro);
    this.service
      .obtenerTicketRetiroEfectivo(idRetiro)
      .pipe(finalize(() => this.generandoTicket.set(null)))
      .subscribe({
        next: (blob) => imprimirPdfBlob(blob),
        error: (err) => {
          console.error('Error al generar el ticket PDF del retiro de efectivo', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.caja.retiroDialog.msg.errorTicket'));
        },
      });
  }

  private imprimirTicket(idRetiro: number): void {
    this.verTicket(idRetiro);
  }

  cerrar(): void {
    this.dialogRef.close(
      new ResultModalModel({ status: this.huboRetiro ? ENUM_ESTATUS_MODAL.OK : ENUM_ESTATUS_MODAL.CANCEL }),
    );
  }

  // ====================== Paginación local (el endpoint no pagina server-side) ======================

  navegar(pagina: string): void {
    this.setLocalPage(parseInt(pagina, 10) || 1);
  }

  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.setLocalPage(1);
  }

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
