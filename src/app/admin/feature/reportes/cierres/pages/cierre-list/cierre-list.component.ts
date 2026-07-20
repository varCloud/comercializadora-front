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
import { paginarCliente } from 'src/app/admin/shared/utils/paginar-cliente';
import { Cierre } from 'src/app/admin/models/reportes-cierres/cierre';
import { CierreSearchParams } from 'src/app/admin/models/reportes-cierres/cierre-search-params';
import { ReportesCierresService } from 'src/app/admin/services/reportes-cierres.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';

/**
 * Pantalla "Reportes > Cierres de Caja". Migra `ReportesController.Cierres/BuscarCierres` del
 * legado: listado con filtros Almacén/Usuario(cajero)/rango de fechas (regla 18, default
 * hoy/hoy) y tabla de 17 columnas (paridad 1:1 con `Views/Reportes/Cierres.cshtml`).
 *
 * **FE-5/FE-6:** consume `ReportesCierresService` (POST /buscar en `cargar()`, igual que el
 * resto del módulo Reportes — el rango hoy/hoy visible en el form ya es un filtro desde la
 * carga inicial, regla 18). **Sin paginación server-side** (el back documenta que
 * `ReportesCierresController` nace sin paginar): se pagina en el cliente con `paginarCliente`
 * sobre el arreglo completo que devuelve la API, manteniendo `app-paginador`/`Paginador<T>`
 * como en el resto de listados (regla 10, "último recurso").
 *
 * **Usuario (cajero) como selector paginado (regla 16):** igual que Devoluciones/Ventas, se
 * reusa `app-select-paginado` + `UsuariosService.buscarPaginado` (sin filtrar por rol: la API
 * de usuarios no expone ese filtro y ningún reporte hermano lo implementa; la HU pedía
 * cajeros=rol 3, ver duda para el revisor). Almacén sigue como `mat-select` chico
 * (`UsuariosService.obtenerAlmacenes`, catálogo de una sola sucursal).
 */
@Component({
  selector: 'app-cierre-list',
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
  templateUrl: './cierre-list.component.html',
})
export class CierreListComponent implements OnInit {
  private readonly service = inject(ReportesCierresService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('reportesCierres') blockUI!: NgBlockUI;
  /** Bloque propio para la exportación (no bloquea/depende del listado). */
  @BlockUI('reportesCierresExportar') blockUIExportar!: NgBlockUI;

  readonly displayedColumns = [
    'fechaCierre',
    'descAlmacen',
    'nombreUsuario',
    'montoApertura',
    'montoIngresosEfectivo',
    'totalVentas',
    'montoVentasContado',
    'montoVentasTarjeta',
    'montoVentasTransferencias',
    'montoVentasOtros',
    'montoVentasCanceladas',
    'productosDevueltos',
    'montoTotalDevoluciones',
    'retirosExcesoEfectivo',
    'montoCierre',
    'efectivoDisponible',
    'efectivoEntregadoEnCierre',
  ];

  readonly pag = new Paginador<Cierre>(CONSTANTS.PAGINATION.PAGE_SIZE);

  // Catálogo de Almacén (mat-select, catálogo chico de una sola sucursal). Usuario/cajero usa
  // app-select-paginado (regla 16, ver fetchUsuarios) — no necesita catálogo precargado.
  readonly almacenes = signal<Catalogo[]>([]);

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

  /** Arreglo completo de la última consulta (sin paginación server-side: se pagina aquí). */
  private allCierres: Cierre[] = [];

  ngOnInit(): void {
    this.usuariosService.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID).subscribe({
      next: (a) => this.almacenes.set(a),
      error: (err) => console.error('Error al cargar catálogo de almacenes', err),
    });

    this.cargar();
  }

  private get filtros(): CierreSearchParams {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      idAlmacen: this.idAlmacen.value,
      idUsuario: this.idUsuario.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
    };
  }

  /** Consulta POST /api/reportes/cierres/buscar con los filtros activos y repagina en el cliente. */
  cargar(): void {
    this.blockUI.start(this.translate.instant('reportesCierres.msg.loading'));
    this.service
      .searchCierres(this.filtros)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (data) => {
          this.allCierres = data;
          this.pag.setPage(paginarCliente(data, 1, this.pag.perPage()));
        },
        error: (err) => {
          console.error('Error al consultar el reporte de cierres', err);
          this.notify.notify('error', this.translate.instant('reportesCierres.msg.loadError'));
        },
      });
  }

  /** Botón "Buscar": aplica los filtros del formulario. */
  buscar(): void {
    this.cargar();
  }

  /** Botón "Limpiar": rango de fechas vuelve a hoy/hoy, el resto a "Todos". */
  limpiarFiltros(): void {
    this.idAlmacen.reset();
    this.idUsuario.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.cargar();
  }

  /** Paginación en el cliente (sin endpoint server-side): `url` es el número de página destino. */
  navegar(url: string): void {
    const page = Number(url) || 1;
    this.pag.setPage(paginarCliente(this.allCierres, page, this.pag.perPage()));
  }

  /** Cambio de tamaño de página: repagina el arreglo ya cargado, sin volver a consultar la API. */
  onPerPage(perPage: number): void {
    this.pag.setPage(paginarCliente(this.allCierres, 1, perPage));
  }

  /**
   * Botón "Exportar a CSV" (FE-7): descarga el reporte con los filtros activos del formulario.
   * Deshabilitado en la plantilla si no hay datos en la tabla (`pag.isEmpty()`).
   */
  exportar(): void {
    this.blockUIExportar.start(this.translate.instant('reportesCierres.msg.exportando'));
    this.service
      .exportarCSV(this.filtros)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        next: (blob) => this.descargarCSV(blob),
        error: (err) => {
          console.error('Error al exportar el reporte de cierres', err);
          this.notify.notify('error', this.translate.instant('reportesCierres.msg.exportError'));
        },
      });
  }

  /** Dispara la descarga del blob CSV en el navegador (anchor temporal). */
  private descargarCSV(blob: Blob): void {
    const nombreArchivo = `Cierres_${formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
    this.notify.notify('success', this.translate.instant('reportesCierres.msg.exportOk'));
  }
}
