import { CurrencyPipe, DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Observable, finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { DevolucionPeReporteItem } from 'src/app/admin/models/reportes-devoluciones-pedidos-especiales/devolucion-pe-reporte-item';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';
import { ReportesDevolucionesPedidosEspecialesService } from 'src/app/admin/services/reportes-devoluciones-pedidos-especiales.service';

/**
 * Pantalla "Reportes > Devoluciones Pedidos Especiales". Migra
 * `ReportesController.DevolucionesPedidosEspeciales/BuscarDevolucionesPedidosEspeciales` del
 * legado: listado con filtros # Ticket/Almacén/Usuario(cajero)/rango de fechas (regla 18,
 * default hoy/hoy) — sin filtro de Línea de Producto (el SP no lo soporta) y sin buscador de
 * texto libre (excepción módulo Reportes, regla 13). Hermano de `reporte_devoluciones`
 * (ventas de piso), distinto origen de datos: pedidos especiales.
 *
 * Filtro Almacén: `mat-select` chico vía `UsuariosService.obtenerAlmacenes`, mismo patrón que
 * `CierreListComponent` (regla 15/16 no aplica: no es selector de Sucursal, es catálogo chico
 * de una sola sucursal). Usuario/cajero: `app-select-paginado` + `UsuariosService.buscarPaginado`
 * (regla 16, sin filtro de rol — igual que el legado `ObtenerUsuarios(0)`).
 *
 * **FE-4:** consume `ReportesDevolucionesPedidosEspecialesService` (`listar`/`irLink`, patrón
 * `ReportesVentasPedidosEspecialesService`): listado y paginación server-side
 * (`Notificacion<T[]>` con `links`/`meta`), exportación dual Descarga/Diferido con los filtros
 * activos. Reemplaza el mock determinista de FE-2.
 */
@Component({
  selector: 'app-devoluciones-pe-list',
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
  templateUrl: './devoluciones-pe-list.component.html',
})
export class DevolucionesPeListComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly reportesDevolucionesPEService = inject(ReportesDevolucionesPedidosEspecialesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('reportesDevolucionesPE') blockUI!: NgBlockUI;
  /** Bloque propio para la exportación (no bloquea/depende del listado). */
  @BlockUI('reportesDevolucionesPEExportar') blockUIExportar!: NgBlockUI;

  readonly displayedColumns = [
    'fechaAlta',
    'tienda',
    'nombreUsuario',
    'idPedidoEspecial',
    'nombreCliente',
    'producto',
    'cantidad',
    'precioVenta',
    'montoTotal',
    'codigoBarrasTicket',
  ];

  readonly pag = new Paginador<DevolucionPeReporteItem>(CONSTANTS.PAGINATION.PAGE_SIZE);

  // Catálogo de Almacén (mat-select chico, mismo patrón que CierreListComponent). Usuario/cajero
  // usa app-select-paginado (regla 16, ver fetchUsuarios) — no necesita catálogo precargado.
  readonly almacenes = signal<Catalogo[]>([]);

  readonly idPedidoEspecial = new FormControl<number | null>(null);
  readonly idAlmacen = new FormControl<number | null>(null);
  readonly idUsuario = new FormControl<number | null>(null);
  readonly hoy = new Date();
  // Rango de fechas con mat-date-range-input (regla 18): default = hoy/hoy, visible desde la
  // carga inicial; `hoy` como `[max]` para que el propio día de hoy nunca quede excluido.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  // fetchPage para el selector paginado de usuario/cajero (regla 16).
  readonly fetchUsuarios = (q: string, page: number): Observable<unknown[]> =>
    this.usuariosService.buscarPaginado(q, page);

  ngOnInit(): void {
    this.usuariosService.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID).subscribe({
      next: (a) => this.almacenes.set(a),
      error: (err) => console.error('Error al cargar catálogo de almacenes', err),
    });

    this.cargar();
  }

  private get filtros() {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      idPedidoEspecial: this.idPedidoEspecial.value,
      idAlmacen: this.idAlmacen.value,
      idUsuario: this.idUsuario.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
    };
  }

  /** Consulta GET /api/reportes/devoluciones-pedidos-especiales con los filtros activos. */
  cargar(): void {
    this.blockUI.start(this.translate.instant('reportesDevolucionesPE.msg.loading'));
    this.reportesDevolucionesPEService
      .listar({ perPage: this.pag.perPage(), page: 1, ...this.filtros })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al consultar el reporte de devoluciones de pedidos especiales', err);
          this.notify.notify('error', this.translate.instant('reportesDevolucionesPE.msg.loadError'));
        },
      });
  }

  /** Botón "Buscar": aplica los filtros del formulario. */
  buscar(): void {
    this.cargar();
  }

  /** Botón "Limpiar": resetea filtros (rango de fechas vuelve a su default hoy/hoy). */
  limpiarFiltros(): void {
    this.idPedidoEspecial.reset();
    this.idAlmacen.reset();
    this.idUsuario.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.cargar();
  }

  /** Paginación server-side: `url` es el link first/prev/next/last que devolvió la API. */
  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('reportesDevolucionesPE.msg.loading'));
    this.reportesDevolucionesPEService
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar el reporte de devoluciones de pedidos especiales', err);
          this.notify.notify('error', this.translate.instant('reportesDevolucionesPE.msg.loadError'));
        },
      });
  }

  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.cargar();
  }

  /** Exporta con los filtros activos (Descarga inmediata o envío Diferido según el servicio). El
   * servicio ya notifica éxito/error internamente vía `NotificationService`; el componente solo
   * loguea el error técnico. */
  exportar(): void {
    this.blockUIExportar.start(this.translate.instant('reportesDevolucionesPE.msg.exportando'));
    this.reportesDevolucionesPEService
      .exportar(this.filtros)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        error: (err) =>
          console.error('Error al exportar el reporte de devoluciones de pedidos especiales', err),
      });
  }
}
