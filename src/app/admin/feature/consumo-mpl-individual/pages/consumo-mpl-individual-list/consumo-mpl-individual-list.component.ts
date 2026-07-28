import { DecimalPipe, CurrencyPipe, DatePipe, formatDate } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { CostoProduccionAgranelPorProducto } from 'src/app/admin/models/consumo-mpl-individual/costo-produccion-agranel-por-producto';
import { ProduccionAgranelService } from 'src/app/admin/services/produccion-agranel.service';
import { ConsumoMplIndividualService } from 'src/app/admin/services/consumo-mpl-individual.service';

/**
 * Pantalla "MPL Individual" (detalle de costo de producción a granel por producto). Migra
 * `Views/ProduccionAgranel/MPLIndividual.cshtml` + `_ObtenerCostoProduccionPorProducto.cshtml`:
 * reporte de solo lectura (sin altas/ediciones/exportar), hermano de "MPL Agrupado"
 * (`consumo-mpl`) pero a nivel de renglón individual del proceso, no agregado por mes/
 * almacén/línea. Filtros: rango de fechas (alta del registro, regla 18) + estatus del
 * proceso de producción agranel (regla 12/16: catálogo pequeño → `mat-select`, mismo
 * precedente que `produccion-agranel-list`) + buscador de texto (regla 13, por código de
 * barras/descripción). `cantidadRestante`/`costoProduccion`/`ultimoCostoCompra` los calcula
 * el SP (no se recalculan en el front, a diferencia de "MPL Agrupado"). Sin selector de
 * Sucursal (regla 15 no aplica: el legado no filtra por sucursal en esta vista).
 */
@Component({
  selector: 'app-consumo-mpl-individual-list',
  standalone: true,
  imports: [
    MaterialModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    PaginadorComponent,
    DecimalPipe,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './consumo-mpl-individual-list.component.html',
})
export class ConsumoMplIndividualListComponent implements OnInit {
  private readonly service = inject(ConsumoMplIndividualService);
  private readonly produccionAgranelService = inject(ProduccionAgranelService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('consumoMplIndividual') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'codigoBarras',
    'descripcionProducto',
    'cantidad',
    'cantidadAceptada',
    'cantidadRestante',
    'fechaAlta',
    'fechaUltimaActualizacion',
    'descripcionEstatus',
    'ultimoCostoCompra',
    'costoProduccion',
  ];

  readonly pag = new Paginador<CostoProduccionAgranelPorProducto>(CONSTANTS.PAGINATION.PAGE_SIZE);

  // Catálogo de estatus: reusa ProduccionAgranelService.obtenerEstatus() (regla 00, ya expuesto
  // por GET /api/produccion-agranel/catalogos/estatus) — no se duplica aquí.
  readonly estatus = signal<Catalogo[]>([]);

  readonly idEstatusProduccionAgranel = new FormControl<number | null>(null);

  readonly hoy = new Date();
  // Rango de fechas con mat-date-range-input (regla 18): default = hoy/hoy, visible desde la
  // carga inicial; `hoy` como `[max]` para que el día de hoy nunca quede excluido del calendario.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  private search = '';
  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((value) => {
        this.search = value;
        this.cargar();
      });

    this.produccionAgranelService.obtenerEstatus().subscribe({
      next: (e) => this.estatus.set(e),
      error: (err) => console.error('Error al cargar catálogo de estatus', err),
    });

    this.cargar();
  }

  applyFilter(value: string): void {
    this.search$.next(value);
  }

  /** Cambió el filtro Estatus o rango de fechas: recarga desde la página 1. */
  onFiltroChange(): void {
    this.cargar();
  }

  private get filtros(): Record<string, string | number | null> {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      idEstatusProduccionAgranel: this.idEstatusProduccionAgranel.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
    };
  }

  /** Primera consulta / recarga desde la página 1 (al buscar o cambiar filtros/tamaño). */
  cargar(): void {
    this.blockUI.start(this.translate.instant('consumoMplIndividual.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), q: this.search, ...this.filtros })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => this.errorListado(err),
      });
  }

  /** Navegación por links (first/prev/next/last). */
  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('consumoMplIndividual.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => this.errorListado(err),
      });
  }

  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.cargar();
  }

  /** Botón "Limpiar": resetea filtros (rango de fechas vuelve a su default hoy/hoy). */
  limpiarFiltros(): void {
    this.idEstatusProduccionAgranel.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.cargar();
  }

  private errorListado(err: unknown): void {
    console.error('Error al listar MPL Individual', err);
    this.notify.notify('error', this.translate.instant('consumoMplIndividual.msg.loadError'));
  }
}
