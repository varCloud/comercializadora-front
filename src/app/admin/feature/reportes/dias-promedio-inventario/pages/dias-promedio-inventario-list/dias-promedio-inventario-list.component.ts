import { DecimalPipe, CurrencyPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { DiasPromedioInventarioItem } from 'src/app/admin/models/reportes-dias-promedio-inventario/dias-promedio-inventario-item';
import { DiasPromedioInventarioSearchParams } from 'src/app/admin/models/reportes-dias-promedio-inventario/dias-promedio-inventario-search-params';
import {
  TIPO_DIAS_PROMEDIO_INVENTARIO_OPTIONS,
  TIPOS_DIAS_PROMEDIO_INVENTARIO_CON_CODIGO_BARRAS,
  TipoDiasPromedioInventarioId,
} from 'src/app/admin/models/reportes-dias-promedio-inventario/tipo-dias-promedio-inventario';
import { ReportesDiasPromedioInventarioService } from 'src/app/admin/services/reportes-dias-promedio-inventario.service';

/**
 * Pantalla "Reportes > Días Promedio Inventario" (FE-4, servicio HTTP real). Migra
 * `ReportesController.DiasPromedioInventario/ObtenerDiasPromedioInventario` del legado: selector
 * Tipo (3 opciones — Global/Línea/Producto, mat-select regla 16; el legado declara un 4º valor
 * `productoVenta` que ningún `if` del SP maneja, código muerto no migrado), rango de fechas +
 * tabla + exportar CSV.
 *
 * **Paginación server-side** (regla 10, decisión de la HU pese al volumen bajo — máx. ~2,032
 * filas en tipo Producto): `navegar()`/`onPerPage()` llaman al servicio (`irLink`/`listar`), no
 * se pagina en memoria.
 *
 * Hermana de `MargenBrutoListComponent`, pero **sin** el endurecimiento de fechas obligatorias:
 * aquí el rango de fechas usa el comportamiento **estándar de la regla 18** (default hoy/hoy,
 * visible desde la carga inicial, NO bloquea "Buscar"/"Exportar") — el legado ya defaultea a
 * "hoy" en el SP si no se envían fechas, y el nuevo SP_V2 conserva ese comportamiento (ver
 * hu_reporte_dias_promedio_inventario.md).
 *
 * **Casos "rango > 365 días" / "backfill incompleto o sin datos":** la API los devuelve como
 * `400` con `estatus:-400`/`estatus:-1` respectivamente (quirks documentados en
 * `ReportesDiasPromedioInventarioService`); el servicio los normaliza a una página vacía y emite
 * el aviso `warning`, así que aquí no hace falta lógica especial — `pag.isEmpty()` ya dispara el
 * mensaje de tabla vacía de la plantilla.
 */
@Component({
  selector: 'app-dias-promedio-inventario-list',
  standalone: true,
  imports: [
    MaterialModule,
    MatNativeDateModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    PaginadorComponent,
    DecimalPipe,
    CurrencyPipe,
  ],
  templateUrl: './dias-promedio-inventario-list.component.html',
})
export class DiasPromedioInventarioListComponent implements OnInit {
  private readonly service = inject(ReportesDiasPromedioInventarioService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('reportesDiasPromedioInventario') blockUI!: NgBlockUI;
  /** Bloque propio para la exportación (no bloquea/depende del listado). */
  @BlockUI('reportesDiasPromedioInventarioExportar') blockUIExportar!: NgBlockUI;

  readonly tipoOptions = TIPO_DIAS_PROMEDIO_INVENTARIO_OPTIONS;
  readonly tipo = new FormControl<TipoDiasPromedioInventarioId>(TipoDiasPromedioInventarioId.Global, {
    nonNullable: true,
  });

  readonly hoy = new Date();
  // Rango de fechas OPCIONAL (regla 18 estándar): default hoy/hoy, visible desde la carga
  // inicial. A diferencia de margen_bruto, sin Validators.required — "Buscar" nunca se bloquea
  // por falta de fechas (el legado y el SP_V2 defaultean a "hoy").
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  readonly pag = new Paginador<DiasPromedioInventarioItem>(CONSTANTS.PAGINATION.PAGE_SIZE);

  ngOnInit(): void {
    this.buscar();
  }

  private get filtros(): DiasPromedioInventarioSearchParams {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      tipo: this.tipo.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
      perPage: this.pag.perPage(),
    };
  }

  get columnaCodigoBarras(): boolean {
    return TIPOS_DIAS_PROMEDIO_INVENTARIO_CON_CODIGO_BARRAS.has(this.tipo.value);
  }

  /** Orden de columnas 1:1 con la tabla legado (`_DiasPromedioInventario.cshtml`). */
  get displayedColumns(): string[] {
    const cols = ['id', 'descripcion'];
    if (this.columnaCodigoBarras) {
      cols.push('codigoBarras');
    }
    cols.push(
      'costoProducto',
      'inventarioPromedioPeriodo',
      'costoInvPromedio',
      'diasPeriodo',
      'costoVendido',
      'diasPromedioInventario',
      'rotacionInventario',
    );
    return cols;
  }

  /** Botón "Buscar": consulta el servicio HTTP real (rango de fechas opcional, ver clase). */
  buscar(): void {
    this.blockUI.start(this.translate.instant('reportesDiasPromedioInventario.msg.loading'));
    this.service
      .listar(this.filtros)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        // El servicio ya notifica al usuario (warning "rango > 365 días"/"sin datos" o error
        // real, ver `ReportesDiasPromedioInventarioService.procesarErrorListado`); aquí solo se
        // loguea.
        error: (err) => console.error('Error al consultar el reporte de días promedio inventario', err),
      });
  }

  /** Botón "Limpiar": tipo vuelve a Global, rango de fechas vuelve a hoy/hoy (regla 18) y recarga. */
  limpiarFiltros(): void {
    this.tipo.setValue(TipoDiasPromedioInventarioId.Global);
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.buscar();
  }

  /** Paginación server-side: `url` es el link first/prev/next/last devuelto por la API. */
  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('reportesDiasPromedioInventario.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => console.error('Error al paginar el reporte de días promedio inventario', err),
      });
  }

  /** Cambio de tamaño de página: recarga desde la página 1 con el nuevo `perPage` (server-side). */
  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.buscar();
  }

  /**
   * Botón "Exportar a CSV": respeta tipo + rango de fechas e ignora la paginación. Maneja el
   * caso de descarga inmediata y el de envío diferido por correo (el propio servicio distingue
   * ambos y notifica al usuario, ver `ReportesDiasPromedioInventarioService.exportarCSV`).
   */
  exportar(): void {
    this.blockUIExportar.start(this.translate.instant('reportesDiasPromedioInventario.msg.exportando'));
    this.service
      .exportarCSV(this.filtros)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        // El servicio ya notifica al usuario (info "envío por correo" o error, ver
        // `ReportesDiasPromedioInventarioService.procesarErrorExportacion`); aquí solo se loguea.
        error: (err) => console.error('Error al exportar el reporte de días promedio inventario', err),
      });
  }
}
