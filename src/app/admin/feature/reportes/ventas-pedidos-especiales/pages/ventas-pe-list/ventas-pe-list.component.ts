import { CurrencyPipe, DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Observable, finalize, map } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { VentaPeReporteItem } from 'src/app/admin/models/reportes-ventas-pedidos-especiales/venta-pe-reporte-item';
import { ClientesService } from 'src/app/admin/services/clientes.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';
import { ReportesVentasPedidosEspecialesService } from 'src/app/admin/services/reportes-ventas-pedidos-especiales.service';

/**
 * Pantalla "Reportes > Ventas Pedidos Especiales". Migra
 * `ReportesController.VentasPedidosEspeciales/BuscarVentasPedidosEspeciales` del legado:
 * listado con filtros Cliente/Usuario/rango de fechas (regla 18, default hoy/hoy) — sin filtro
 * de Línea de Producto (el SP `SP_CONSULTA_VENTAS_PEDIDOS_ESPECIALESV2` no lo soporta) y sin
 * buscador de texto libre (excepción módulo Reportes, regla 13) — + botón de exportación con
 * los filtros activos, igual que `Reportes > Ventas`. Columna nueva "Ver factura" (`rutaFactura`)
 * que el legado calculaba pero no mostraba (desvío aprobado en el paso 01).
 *
 * Consume `ReportesVentasPedidosEspecialesService` (`listar`/`irLink`/`exportar`, patrón
 * `ReportesVentasService`): listado y paginación server-side (`Notificacion<T[]>` con
 * `links`/`meta`), exportación dual Descarga/Diferido con los filtros activos.
 */
@Component({
  selector: 'app-ventas-pe-list',
  standalone: true,
  imports: [
    MaterialModule,
    MatNativeDateModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    SelectPaginadoComponent,
    PaginadorComponent,
    DatePipe,
    DecimalPipe,
    CurrencyPipe,
  ],
  templateUrl: './ventas-pe-list.component.html',
  styleUrl: './ventas-pe-list.component.scss',
})
export class VentasPeListComponent implements OnInit {
  private readonly clientesService = inject(ClientesService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly reportesVentasPEService = inject(ReportesVentasPedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('reportesVentasPE') blockUI!: NgBlockUI;
  /** Bloque propio para la exportación (no bloquea/depende del listado). */
  @BlockUI('reportesVentasPEExportar') blockUIExportar!: NgBlockUI;

  readonly displayedColumns = [
    'fecha',
    'sucursal',
    'tienda',
    'cajero',
    'folio',
    'cliente',
    'codigoBarras',
    'lineaProducto',
    'producto',
    'cantidad',
    'precioVenta',
    'iva',
    'montoTotal',
    'costoCompra',
    'utilidad',
    'margenBruto',
    'formaPago',
    'verFactura',
  ];

  readonly pag = new Paginador<VentaPeReporteItem>(CONSTANTS.PAGINATION.PAGE_SIZE);

  // Filtros: Cliente/Usuario (catálogos grandes → selector paginado server-side, regla 16,
  // reusando ClientesService.listar/UsuariosService.buscarPaginado sin métodos nuevos) + rango
  // de fechas. Sin Línea de Producto (el SP no lo soporta, tampoco activo en la vista legado).
  readonly idCliente = new FormControl<number | null>(null);
  readonly idUsuario = new FormControl<number | null>(null);
  readonly hoy = new Date();
  // Rango de fechas con mat-date-range-input (regla 18): default = hoy/hoy, visible desde la
  // carga inicial; `hoy` como `[max]` para que el propio día de hoy nunca quede excluido.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  // fetchPage para los selectores paginados de cliente/usuario (regla 16) — reales, no mock.
  readonly fetchClientes = (q: string, page: number): Observable<unknown[]> =>
    this.clientesService.listar({ q, page, perPage: 25 }).pipe(map((res) => res.data));

  readonly fetchUsuarios = (q: string, page: number): Observable<unknown[]> =>
    this.usuariosService.buscarPaginado(q, page);

  ngOnInit(): void {
    this.cargar();
  }

  private get filtros() {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      idCliente: this.idCliente.value,
      idUsuario: this.idUsuario.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
    };
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('reportesVentasPE.msg.loading'));
    this.reportesVentasPEService
      .listar({ perPage: this.pag.perPage(), page: 1, ...this.filtros })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar el reporte de ventas de pedidos especiales', err);
          this.notify.notify('error', this.translate.instant('reportesVentasPE.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('reportesVentasPE.msg.loading'));
    this.reportesVentasPEService
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar el reporte de ventas de pedidos especiales', err);
          this.notify.notify('error', this.translate.instant('reportesVentasPE.msg.loadError'));
        },
      });
  }

  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.cargar();
  }

  /** Botón "Buscar": aplica los filtros del formulario. */
  buscar(): void {
    this.cargar();
  }

  /** Botón "Limpiar": resetea filtros (rango de fechas vuelve a su default hoy/hoy). */
  limpiarFiltros(): void {
    this.idCliente.reset();
    this.idUsuario.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.cargar();
  }

  /** Exporta con los filtros activos (mismo criterio que Reportes > Ventas). El servicio ya
   * notifica éxito/error internamente vía `NotificationService`; el componente solo loguea el
   * error técnico. */
  exportar(): void {
    this.blockUIExportar.start(this.translate.instant('reportesVentasPE.msg.exportando'));
    this.reportesVentasPEService
      .exportar(this.filtros)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        error: (err) =>
          console.error('Error al exportar el reporte de ventas de pedidos especiales', err),
      });
  }
}
