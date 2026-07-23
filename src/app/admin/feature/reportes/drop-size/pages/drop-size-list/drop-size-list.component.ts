import { CurrencyPipe, DecimalPipe, formatDate } from '@angular/common';
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
import { DropSizeItem } from 'src/app/admin/models/reportes-drop-size/drop-size-item';
import { DropSizeSearchParams } from 'src/app/admin/models/reportes-drop-size/drop-size-search-params';
import {
  TIPO_DROP_SIZE_OPTIONS,
  TIPOS_DROP_SIZE_CON_CODIGO_BARRAS,
  TipoDropSizeId,
} from 'src/app/admin/models/reportes-drop-size/tipo-drop-size';
import { ReportesDropSizeService } from 'src/app/admin/services/reportes-drop-size.service';

/**
 * Pantalla "Reportes > Drop Size" (FE-4, servicio HTTP real). Migra `ReportesController.DropSize/
 * ObtenerDropSize` del legado: selector Tipo (3 opciones — Global/Línea/Producto, mat-select
 * regla 16; el legado reusa `EnumTipoMargenBruto`, cuyo 4º valor `Venta_Producto` no se expone en
 * este selector, código muerto no migrado), rango de fechas + tabla + exportar CSV.
 *
 * **Paginación server-side** (regla 10, decisión de la HU por consistencia con
 * `margen_bruto`/`dias_promedio_inventario`): `navegar()`/`onPerPage()` llaman al servicio
 * (`irLink`/`listar`), no se pagina en memoria.
 *
 * **Rango de fechas OPCIONAL** (regla 18 estándar, igual que `dias_promedio_inventario`, a
 * diferencia de `margen_bruto`): default hoy/hoy visible desde la carga inicial, sin
 * `Validators.required` — "Buscar"/"Exportar" nunca se bloquean por falta de fechas (el SP_V2
 * defaultea a "hoy" internamente si no se envían).
 *
 * **Caso "sin ventas en el rango":** la API lo devuelve como `400` con `estatus:-1` (quirk
 * documentado en `ReportesDropSizeService`); el servicio lo normaliza a una página vacía y emite
 * el aviso `warning`, así que aquí no hace falta lógica especial — `pag.isEmpty()` ya dispara el
 * mensaje de tabla vacía de la plantilla.
 */
@Component({
  selector: 'app-drop-size-list',
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
  templateUrl: './drop-size-list.component.html',
})
export class DropSizeListComponent implements OnInit {
  private readonly service = inject(ReportesDropSizeService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('reportesDropSize') blockUI!: NgBlockUI;
  /** Bloque propio para la exportación (no bloquea/depende del listado). */
  @BlockUI('reportesDropSizeExportar') blockUIExportar!: NgBlockUI;

  readonly tipoOptions = TIPO_DROP_SIZE_OPTIONS;
  readonly tipo = new FormControl<TipoDropSizeId>(TipoDropSizeId.Global, { nonNullable: true });

  readonly hoy = new Date();
  // Rango de fechas OPCIONAL (regla 18 estándar): default hoy/hoy, visible desde la carga
  // inicial. Sin Validators.required — "Buscar" nunca se bloquea por falta de fechas.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  readonly pag = new Paginador<DropSizeItem>(CONSTANTS.PAGINATION.PAGE_SIZE);

  ngOnInit(): void {
    this.buscar();
  }

  private get filtros(): DropSizeSearchParams {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      tipo: this.tipo.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
      perPage: this.pag.perPage(),
    };
  }

  get columnaCodigoBarras(): boolean {
    return TIPOS_DROP_SIZE_CON_CODIGO_BARRAS.has(this.tipo.value);
  }

  /** Orden de columnas 1:1 con la tabla legado (`_DropSize.cshtml`). */
  get displayedColumns(): string[] {
    const cols = ['id', 'descripcion'];
    if (this.columnaCodigoBarras) {
      cols.push('codigoBarras');
    }
    cols.push('totalClientes', 'totalVentas', 'totalProductos', 'dropSizeVentas', 'dropSizeCantidad');
    return cols;
  }

  /** Botón "Buscar": consulta el servicio HTTP real (rango de fechas opcional, ver clase). */
  buscar(): void {
    this.blockUI.start(this.translate.instant('reportesDropSize.msg.loading'));
    this.service
      .listar(this.filtros)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        // El servicio ya notifica al usuario (warning "sin ventas" o error real, ver
        // `ReportesDropSizeService.procesarErrorListado`); aquí solo se loguea.
        error: (err) => console.error('Error al consultar el reporte de drop size', err),
      });
  }

  /** Botón "Limpiar": tipo vuelve a Global, rango de fechas vuelve a hoy/hoy (regla 18) y recarga. */
  limpiarFiltros(): void {
    this.tipo.setValue(TipoDropSizeId.Global);
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.buscar();
  }

  /** Paginación server-side: `url` es el link first/prev/next/last devuelto por la API. */
  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('reportesDropSize.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => console.error('Error al paginar el reporte de drop size', err),
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
   * ambos y notifica al usuario, ver `ReportesDropSizeService.exportarCSV`).
   */
  exportar(): void {
    this.blockUIExportar.start(this.translate.instant('reportesDropSize.msg.exportando'));
    this.service
      .exportarCSV(this.filtros)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        // El servicio ya notifica al usuario (info "envío por correo" o error, ver
        // `ReportesDropSizeService.procesarErrorExportacion`); aquí solo se loguea.
        error: (err) => console.error('Error al exportar el reporte de drop size', err),
      });
  }
}
