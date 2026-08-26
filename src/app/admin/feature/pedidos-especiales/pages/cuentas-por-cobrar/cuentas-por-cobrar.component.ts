import { CurrencyPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { abrirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { CuentaPorCobrar } from 'src/app/admin/models/pedidos-especiales/cuenta-por-cobrar';
import { PedidosEspecialesService } from 'src/app/admin/services/pedidos-especiales.service';
import {
  RealizarAbonoDialogComponent,
  RealizarAbonoDialogData,
} from '../../components/realizar-abono-dialog/realizar-abono-dialog.component';

/**
 * Página "Cuentas por Cobrar" (Pedidos Especiales) — réplica de `Views/PedidosEspecialesV2/
 * ConsultarCuentasPorCobrar.cshtml` (hallazgo P-01 de la auditoría de paridad, nunca migrada).
 * Ver HU/tareas en `.claude/docs/feature/cuentas_por_cobrar_pe/`.
 *
 * Listado paginado server-side (regla 10) + buscador por nombre de cliente (regla 13, debounce
 * 350ms). "Generar PDF" abre el desglose de cuenta (A4, solo se ve — nunca al print-agent).
 * "Realizar abono" abre `RealizarAbonoDialogComponent`, que trae su propio guard de caja
 * abierta e imprime el ticket del abono al guardar con éxito.
 */
@Component({
  selector: 'app-cuentas-por-cobrar',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, BlockUIModule, TranslatePipe, PaginadorComponent, CurrencyPipe],
  templateUrl: './cuentas-por-cobrar.component.html',
  styleUrl: './cuentas-por-cobrar.component.scss',
})
export class CuentasPorCobrarComponent implements OnInit {
  private readonly service = inject(PedidosEspecialesService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('cuentas-por-cobrar') blockUI!: NgBlockUI;
  /** Bloque propio para la exportación (no bloquea/depende del listado). */
  @BlockUI('cuentas-por-cobrar-exportar') blockUIExportar!: NgBlockUI;

  readonly displayedColumns = [
    'idCliente',
    'nombreCliente',
    'montoTotal',
    'montoPagado',
    'montoAdeudado',
    'action',
  ];

  readonly pag = new Paginador<CuentaPorCobrar>(CONSTANTS.PAGINATION.PAGE_SIZE);

  private search = '';
  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((value) => {
      this.search = value;
      this.cargar();
    });

    this.cargar();
  }

  /** Primera consulta / recarga desde la página 1 (al buscar, cambiar tamaño, o tras un abono). */
  cargar(): void {
    this.blockUI.start(this.translate.instant('pedidosEspeciales.cuentasPorCobrar.msg.cargandoListado'));
    this.service
      .listarCuentasPorCobrar({ perPage: this.pag.perPage(), q: this.search })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar las cuentas por cobrar', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.cuentasPorCobrar.msg.errorListado'));
        },
      });
  }

  /** Navegación por links (first/prev/next/last) — no recompone el número de página (regla 10). */
  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('pedidosEspeciales.cuentasPorCobrar.msg.cargandoListado'));
    this.service
      .irLinkCuentasPorCobrar(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar las cuentas por cobrar', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.cuentasPorCobrar.msg.errorListado'));
        },
      });
  }

  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.cargar();
  }

  applyFilter(value: string): void {
    this.search$.next(value);
  }

  /** "Generar PDF" — desglose de cargos/abonos del cliente (A4). Solo se ve, nunca al print-agent. */
  generarPdf(cuenta: CuentaPorCobrar): void {
    this.blockUI.start(this.translate.instant('pedidosEspeciales.cuentasPorCobrar.msg.generandoPdf'));
    this.service
      .obtenerPdfCuentaPorCobrar(cuenta.idCliente)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (blob) => abrirPdfBlob(blob),
        error: (err) => {
          console.error('Error al generar el PDF de la cuenta por cobrar', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.cuentasPorCobrar.msg.generarPdfError'));
        },
      });
  }

  /**
   * "Exportar a CSV" (P-02, auditoría de paridad `cuentas-por-cobrar-pe`): mismo criterio de
   * búsqueda `q` que el listado, todas las filas (server-side, no cliente).
   */
  exportar(): void {
    this.blockUIExportar.start(this.translate.instant('pedidosEspeciales.cuentasPorCobrar.msg.exportando'));
    this.service
      .exportarCuentasPorCobrarCSV(this.search)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        next: (blob) => this.descargarCSV(blob),
        error: (err) => {
          console.error('Error al exportar las cuentas por cobrar', err);
          this.notify.notify('error', this.translate.instant('pedidosEspeciales.cuentasPorCobrar.msg.exportError'));
        },
      });
  }

  /** Dispara la descarga del blob CSV en el navegador (anchor temporal). */
  private descargarCSV(blob: Blob): void {
    const nombreArchivo = `CuentasPorCobrar_${formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
    this.notify.notify('success', this.translate.instant('pedidosEspeciales.cuentasPorCobrar.msg.exportOk'));
  }

  /** "Realizar abono" — abre el diálogo con el detalle de pedidos con adeudo del cliente + el formulario de abono. */
  realizarAbono(cuenta: CuentaPorCobrar): void {
    this.dialog
      .open<RealizarAbonoDialogComponent, RealizarAbonoDialogData>(RealizarAbonoDialogComponent, {
        data: { idCliente: cuenta.idCliente, nombreCliente: cuenta.nombreCliente },
        width: '1000px',
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe((res: ResultModalModel | undefined) => {
        if (res?.status !== ENUM_ESTATUS_MODAL.OK) return;
        this.cargar();
      });
  }
}
