import { CurrencyPipe, DecimalPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { EMPTY_LINKS, EMPTY_META } from 'src/app/admin/models/shared/paged-result';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { MargenBrutoItem } from 'src/app/admin/models/reportes-margen-bruto/margen-bruto-item';
import { MargenBrutoSearchParams } from 'src/app/admin/models/reportes-margen-bruto/margen-bruto-search-params';
import {
  TIPO_MARGEN_BRUTO_OPTIONS,
  TIPOS_MARGEN_BRUTO_CON_CODIGO_BARRAS,
  TipoMargenBrutoId,
} from 'src/app/admin/models/reportes-margen-bruto/tipo-margen-bruto';
import { ReportesMargenBrutoService } from 'src/app/admin/services/reportes-margen-bruto.service';

/**
 * Pantalla "Reportes > Margen Bruto" (FE-4, servicio HTTP real). Migra
 * `ReportesController.MargenBruto/BuscarMargenBruto` del legado: selector Tipo (4 opciones,
 * mat-select regla 16), rango de fechas + tabla + exportar CSV.
 *
 * **Paginación server-side** (regla 10, decisión de la HU): a diferencia de los reportes
 * hermanos (paginación en cliente), aquí `navegar()`/`onPerPage()` sí llaman al servicio
 * (`irLink`/`listar`) porque el volumen de `Venta_Producto` (~3.6M filas sin filtro) hace
 * inviable traer todo el set a memoria.
 *
 * **Caso "sin ventas en el rango":** la API lo devuelve como `400` con `estatus:-1` en el body
 * (quirk documentado en `ReportesMargenBrutoService`); el servicio lo normaliza a una página
 * vacía y emite el aviso `warning`, así que aquí no hace falta lógica especial — `pag.isEmpty()`
 * ya dispara el mensaje de tabla vacía de la plantilla.
 *
 * ⚠️ Excepción documentada a la regla 18 (rango de fechas): el default estándar es hoy/hoy
 * visible desde la carga inicial. Aquí NO se aplica ese default: el rango es **obligatorio
 * explícito** (ver hu_reporte_margen_bruto.md — sin fechas la API responde 400, y
 * `Venta_Producto` sin filtro son ~3.6M filas). El control arranca en `null`/`null`,
 * `Validators.required` en ambos, y "Buscar"/"Exportar" quedan deshabilitados mientras el
 * rango no sea válido — el listado nunca se consulta con fechas vacías.
 */
@Component({
  selector: 'app-margen-bruto-list',
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
  templateUrl: './margen-bruto-list.component.html',
})
export class MargenBrutoListComponent implements OnInit {
  private readonly service = inject(ReportesMargenBrutoService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('reportesMargenBruto') blockUI!: NgBlockUI;
  /** Bloque propio para la exportación (no bloquea/depende del listado). */
  @BlockUI('reportesMargenBrutoExportar') blockUIExportar!: NgBlockUI;

  readonly tipoOptions = TIPO_MARGEN_BRUTO_OPTIONS;
  readonly tipo = new FormControl<TipoMargenBrutoId>(TipoMargenBrutoId.Global, {
    nonNullable: true,
    validators: Validators.required,
  });

  // Rango de fechas OBLIGATORIO (excepción a la regla 18, ver comentario de la clase): sin
  // default hoy/hoy, arranca vacío y con Validators.required en ambos controles.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(null, Validators.required),
    fin: new FormControl<Date | null>(null, Validators.required),
  });
  readonly hoy = new Date();

  readonly pag = new Paginador<MargenBrutoItem>(CONSTANTS.PAGINATION.PAGE_SIZE);

  ngOnInit(): void {
    // Sin carga inicial: el rango de fechas es obligatorio y arranca vacío (ver comentario de
    // la clase), así que no hay una consulta válida hasta que el usuario complete el filtro y
    // presione "Buscar".
  }

  /** Arma los filtros de la consulta actual a partir del formulario (tipo + rango de fechas). */
  private get filtros(): MargenBrutoSearchParams {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      tipo: this.tipo.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : '',
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : '',
      perPage: this.pag.perPage(),
    };
  }

  get columnaCodigoBarras(): boolean {
    return TIPOS_MARGEN_BRUTO_CON_CODIGO_BARRAS.has(this.tipo.value);
  }

  get displayedColumns(): string[] {
    const base = ['id', 'descripcion', 'totalVentas', 'costoVentas', 'contribucionMarginal', 'margenBruto'];
    return this.columnaCodigoBarras ? [...base, 'codigoBarras'] : base;
  }

  /** Botón "Buscar": valida el rango de fechas obligatorio y consulta el servicio HTTP real. */
  buscar(): void {
    if (this.tipo.invalid || this.rangoFechasForm.invalid) {
      this.tipo.markAsTouched();
      this.rangoFechasForm.markAllAsTouched();
      this.notify.notify('warning', this.translate.instant('reportesMargenBruto.msg.fechasObligatorias'));
      return;
    }

    this.blockUI.start(this.translate.instant('reportesMargenBruto.msg.loading'));
    this.service
      .listar(this.filtros)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        // El servicio ya notifica al usuario (warning "sin ventas" o error real, ver
        // `ReportesMargenBrutoService.procesarErrorListado`); aquí solo se loguea.
        error: (err) => console.error('Error al consultar el reporte de margen bruto', err),
      });
  }

  /** Botón "Limpiar": tipo vuelve a Global, rango de fechas vuelve a vacío (sin default, ver clase) y limpia el listado. */
  limpiarFiltros(): void {
    this.tipo.setValue(TipoMargenBrutoId.Global);
    this.rangoFechasForm.reset({ inicio: null, fin: null });
    this.pag.setPage({ data: [], links: { ...EMPTY_LINKS }, meta: { ...EMPTY_META, perPage: this.pag.perPage() } });
  }

  /** Paginación server-side: `url` es el link first/prev/next/last devuelto por la API. */
  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('reportesMargenBruto.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => console.error('Error al paginar el reporte de margen bruto', err),
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
   * ambos y notifica al usuario, ver `ReportesMargenBrutoService.exportarCSV`).
   * Deshabilitado en la plantilla si el rango de fechas no es válido.
   */
  exportar(): void {
    if (this.tipo.invalid || this.rangoFechasForm.invalid) {
      this.tipo.markAsTouched();
      this.rangoFechasForm.markAllAsTouched();
      this.notify.notify('warning', this.translate.instant('reportesMargenBruto.msg.fechasObligatorias'));
      return;
    }

    this.blockUIExportar.start(this.translate.instant('reportesMargenBruto.msg.exportando'));
    this.service
      .exportarCSV(this.filtros)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        // El servicio ya notifica al usuario (info "envío por correo" o error, ver
        // `ReportesMargenBrutoService.procesarErrorExportacion`); aquí solo se loguea.
        error: (err) => console.error('Error al exportar el reporte de margen bruto', err),
      });
  }
}
