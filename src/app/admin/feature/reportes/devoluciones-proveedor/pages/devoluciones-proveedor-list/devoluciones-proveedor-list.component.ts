import { DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Observable, finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { DevolucionProveedorItem } from 'src/app/admin/models/reportes-devoluciones-proveedor/devolucion-proveedor-item';
import { DevolucionProveedorSearchParams } from 'src/app/admin/models/reportes-devoluciones-proveedor/devolucion-proveedor-search-params';
import { ProveedoresService } from 'src/app/admin/services/proveedores.service';
import { ReportesDevolucionesProveedorService } from 'src/app/admin/services/reportes-devoluciones-proveedor.service';

/**
 * Pantalla "Reportes > Devoluciones a Proveedor" (FE-4, servicio HTTP real). Migra
 * `ReportesController.DevolucionesProveedor/ObtenerDevolucionesProveedor` del legado: por
 * proveedor y rango de fechas, el historial de devoluciones de mercancía a proveedores
 * (defecto/rechazo de compra). 10º sub-reporte del módulo "Reportes".
 *
 * Backend aprobado (contrato verificado en `task_reporte_devoluciones_proveedor.md`):
 * paginación **server-side** (`app-paginador` + `Paginador<T>`, regla 10) vía
 * `ReportesDevolucionesProveedorService.listar()`/`irLink()`. `idProveedor`/`fechaIni`/
 * `fechaFin` son opcionales a nivel API (sin ellas = histórico completo); no hay ningún quirk
 * de negocio bajo `400` documentado para este endpoint (a diferencia de
 * `margen_bruto`/`drop_size`), por lo que los errores se notifican tal cual llegan.
 *
 * **Rango de fechas: default hoy/hoy ESTÁNDAR** (regla 18, SIN excepción) — a diferencia de
 * `NivelServicioProveedorListComponent`, que sí documentó una excepción sin default. Aquí los
 * controles arrancan en `hoy`/`hoy` visibles y "Limpiar" restaura ese mismo default.
 *
 * **Selector Proveedor** vía `app-select-paginado` (regla 16, ~153 proveedores reales):
 * reutiliza `ProveedoresService.buscarPaginado` (mismo `fetchPage` que ya consume
 * `compras-list`/`compra-form-dialog`) — no se duplica el catálogo de Proveedores.
 *
 * **Exportar a CSV:** dual descarga inmediata / envío diferido por correo según el umbral de
 * `Exportacion:UmbralDescargaInmediata` (`ReportesDevolucionesProveedorService.exportarCSV`,
 * mismo patrón que el resto de los hermanos de Reportes).
 */
@Component({
  selector: 'app-devoluciones-proveedor-list',
  standalone: true,
  imports: [
    MaterialModule,
    MatNativeDateModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    PaginadorComponent,
    SelectPaginadoComponent,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './devoluciones-proveedor-list.component.html',
})
export class DevolucionesProveedorListComponent implements OnInit {
  private readonly service = inject(ReportesDevolucionesProveedorService);
  private readonly proveedoresService = inject(ProveedoresService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('reportesDevolucionesProveedor') blockUI!: NgBlockUI;
  /** Bloque propio para la exportación (no bloquea/depende del listado). */
  @BlockUI('reportesDevolucionesProveedorExportar') blockUIExportar!: NgBlockUI;

  readonly displayedColumns = [
    'fecha',
    'idCompra',
    'idDevolucion',
    'nombreUsuario',
    'nombreProveedor',
    'codigoBarras',
    'descripcionLinea',
    'descripcion',
    'cantidad',
    'cantidadRecibida',
    'cantidadDevuelta',
    'observaciones',
  ];

  readonly pag = new Paginador<DevolucionProveedorItem>(CONSTANTS.PAGINATION.PAGE_SIZE);

  readonly idProveedor = new FormControl<number | null>(null);

  readonly hoy = new Date();
  // Rango de fechas: default hoy/hoy ESTÁNDAR (regla 18, sin excepción), visible desde la carga
  // inicial. "Limpiar" restaura este mismo default (ver limpiarFiltros).
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  // fetchPage del selector paginado de Proveedor (regla 16) — reutiliza el mismo catálogo/
  // endpoint que ya consume `compras-list`/`compra-form-dialog`, no se duplica.
  readonly fetchProveedores = (q: string, page: number): Observable<unknown[]> =>
    this.proveedoresService.buscarPaginado(q, page);

  ngOnInit(): void {
    this.buscar();
  }

  private get filtros(): DevolucionProveedorSearchParams {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      idProveedor: this.idProveedor.value || null,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
      perPage: this.pag.perPage(),
    };
  }

  /** Botón "Buscar": aplica los filtros del formulario (proveedor + rango de fechas), página 1. */
  buscar(): void {
    this.blockUI.start(this.translate.instant('reportesDevolucionesProveedor.msg.loading'));
    this.service
      .listar(this.filtros)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar el reporte de devoluciones a proveedor', err);
          this.notify.notify('error', this.translate.instant('reportesDevolucionesProveedor.msg.loadError'));
        },
      });
  }

  /** Botón "Limpiar": proveedor a "todos", rango de fechas vuelve a hoy/hoy (regla 18) y recarga. */
  limpiarFiltros(): void {
    this.idProveedor.reset(null);
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.buscar();
  }

  /** Navega a una URL de paginación (link first/prev/next/last que devolvió la API). */
  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('reportesDevolucionesProveedor.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar el reporte de devoluciones a proveedor', err);
          this.notify.notify('error', this.translate.instant('reportesDevolucionesProveedor.msg.loadError'));
        },
      });
  }

  /** Cambio de tamaño de página: recarga desde la página 1 con el nuevo `perPage`. */
  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.buscar();
  }

  /**
   * Botón "Exportar a CSV": con los mismos filtros activos. Descarga inmediata o notificación de
   * envío diferido por correo según el umbral configurado en la API
   * (`ReportesDevolucionesProveedorService.exportarCSV`).
   */
  exportar(): void {
    this.blockUIExportar.start(this.translate.instant('reportesDevolucionesProveedor.msg.exportando'));
    this.service
      .exportarCSV(this.filtros)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        error: (err) => console.error('Error al exportar el reporte de devoluciones a proveedor', err),
      });
  }
}
