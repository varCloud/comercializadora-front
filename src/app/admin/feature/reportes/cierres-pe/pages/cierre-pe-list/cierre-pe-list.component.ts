import { CurrencyPipe, DatePipe, DecimalPipe, formatDate } from '@angular/common';
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
import { paginarCliente } from 'src/app/admin/shared/utils/paginar-cliente';
import { CierrePedidosEspeciales } from 'src/app/admin/models/reportes-cierres-pe/cierre-pedidos-especiales';
import { CierrePedidosPESearchParams } from 'src/app/admin/models/reportes-cierres-pe/cierre-pedidos-pe-search-params';
import { ReportesCierresPEService } from 'src/app/admin/services/reportes-cierres-pe.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';

/**
 * Pantalla "Reportes > Cierres de Pedidos Especiales" (FE-3). Migra
 * `ReportesController.ConsultaCierresPedidosEspeciales` del legado: listado con filtros
 * Usuario/rango de fechas (regla 18, default hoy/hoy) y tabla de 20 columnas (paridad 1:1 con
 * `CierrePedidosEspeciales`).
 *
 * Hermana de "Cierres de Caja" (`CierreListComponent`): mismo patrón de consumo
 * (`searchCierres` en `cargar()`, paginación en cliente con `paginarCliente` porque el back no
 * pagina server-side, regla 10 "último recurso"), pero **sin** filtro de Almacén (no existe en
 * el legado de Pedidos Especiales).
 *
 * **Usuario como selector paginado (regla 16):** se reusa `app-select-paginado` +
 * `UsuariosService.buscarPaginado`, igual que Cierres de Caja/Ventas/Merma/Devoluciones — el
 * catálogo real de usuarios supera el umbral de 25 (regla 16), así que se mantiene consistente
 * con el resto de reportes en vez de introducir un `mat-select`/`ng-select` distinto aquí.
 */
@Component({
  selector: 'app-cierre-pe-list',
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
  templateUrl: './cierre-pe-list.component.html',
})
export class CierrePEListComponent implements OnInit {
  private readonly service = inject(ReportesCierresPEService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('reportesCierresPE') blockUI!: NgBlockUI;
  /** Bloque propio para la exportación (no bloquea/depende del listado). */
  @BlockUI('reportesCierresPEExportar') blockUIExportar!: NgBlockUI;

  readonly displayedColumns = [
    'idCierrePedidoEspecial',
    'fechaCierre',
    'nombreUsuario',
    'ventasContado',
    'ventasTC',
    'ventasTransferencias',
    'ventasOtrasFormasPago',
    'ventasCredito',
    'montoDevoluciones',
    'montoIngresosEfectivo',
    'montoRetirosEfectivo',
    'montoCierreEfectivo',
    'montoCierreTC',
    'efectivoEntregadoEnCierre',
    'noDevoluciones',
    'noTicketsEfectivo',
    'noTicketsCredito',
    'noPedidosEnResguardo',
    'totalEfectivo',
    'abonosEfectivo',
  ];

  readonly pag = new Paginador<CierrePedidosEspeciales>(CONSTANTS.PAGINATION.PAGE_SIZE);

  readonly idUsuario = new FormControl<number | null>(null);
  readonly hoy = new Date();
  // Rango de fechas con mat-date-range-input (regla 18): default = hoy/hoy, visible desde la
  // carga inicial; `hoy` como `[max]` para que el propio día de hoy nunca quede excluido.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  // fetchPage para el selector paginado de usuario (regla 16).
  readonly fetchUsuarios = (q: string, page: number): Observable<unknown[]> =>
    this.usuariosService.buscarPaginado(q, page);

  /** Arreglo completo de la última consulta (sin paginación server-side: se pagina aquí). */
  private allCierres: CierrePedidosEspeciales[] = [];

  ngOnInit(): void {
    this.cargar();
  }

  private get filtros(): CierrePedidosPESearchParams {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      idUsuario: this.idUsuario.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
    };
  }

  /** Consulta POST /api/reportes/cierres-pe/buscar con los filtros activos y repagina en el cliente. */
  cargar(): void {
    this.blockUI.start(this.translate.instant('reportesCierresPE.msg.loading'));
    this.service
      .searchCierres(this.filtros)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (data) => {
          this.allCierres = data;
          this.pag.setPage(paginarCliente(data, 1, this.pag.perPage()));
        },
        error: (err) => {
          console.error('Error al consultar el reporte de cierres de pedidos especiales', err);
          this.notify.notify('error', this.translate.instant('reportesCierresPE.msg.loadError'));
        },
      });
  }

  /** Botón "Buscar": aplica los filtros del formulario. */
  buscar(): void {
    this.cargar();
  }

  /** Botón "Limpiar": rango de fechas vuelve a hoy/hoy, el resto a "Todos". */
  limpiarFiltros(): void {
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
   * Botón "Exportar a CSV": descarga el reporte con los filtros activos del formulario.
   * Deshabilitado en la plantilla si no hay datos en la tabla (`pag.isEmpty()`).
   */
  exportar(): void {
    this.blockUIExportar.start(this.translate.instant('reportesCierresPE.msg.exportando'));
    this.service
      .exportarCSV(this.filtros)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        next: (blob) => this.descargarCSV(blob),
        error: (err) => {
          console.error('Error al exportar el reporte de cierres de pedidos especiales', err);
          this.notify.notify('error', this.translate.instant('reportesCierresPE.msg.exportError'));
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
    this.notify.notify('success', this.translate.instant('reportesCierresPE.msg.exportOk'));
  }
}
