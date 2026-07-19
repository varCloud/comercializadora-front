import { CurrencyPipe, DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { InventarioReporteItem } from 'src/app/admin/models/reportes-inventario/inventario-reporte-item';
import { ReportesInventarioService } from 'src/app/admin/services/reportes-inventario.service';
import { ProductosService } from 'src/app/admin/services/productos.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';

/**
 * Pantalla "Reportes > Inventario". Migra `ReportesController.Inventario/BuscarInventario` del
 * legado: listado paginado con filtros Línea de Producto/Almacén/rango de fechas (regla 18,
 * default hoy/hoy)/buscador (regla 13) + 2 exportaciones completas ("Reporte General"/"Reporte
 * por Ubicación") que **ignoran** los filtros de pantalla (paridad legado, decisión explícita
 * del usuario). Catálogos de Línea/Almacén reusados de ProductosService/UsuariosService (regla
 * 00, mismo patrón que Consumo de MPL/Producción líquidos).
 */
@Component({
  selector: 'app-inventario-list',
  standalone: true,
  imports: [
    MaterialModule,
    MatNativeDateModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    NgSelectModule,
    PaginadorComponent,
    DatePipe,
    DecimalPipe,
    CurrencyPipe,
  ],
  templateUrl: './inventario-list.component.html',
})
export class InventarioListComponent implements OnInit {
  private readonly service = inject(ReportesInventarioService);
  private readonly productosService = inject(ProductosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('reportesInventario') blockUI!: NgBlockUI;
  /** Bloque propio para las exportaciones (no bloquea/depende del listado). */
  @BlockUI('reportesInventarioExportar') blockUIExportar!: NgBlockUI;

  readonly displayedColumns = [
    'fecha',
    'almacen',
    'descripcionLinea',
    'descripcion',
    'codigoBarras',
    'cantidad',
    'costo',
  ];

  readonly pag = new Paginador<InventarioReporteItem>(CONSTANTS.PAGINATION.PAGE_SIZE);

  readonly lineas = signal<Catalogo[]>([]);
  readonly almacenes = signal<Catalogo[]>([]);

  // Filtros (equivalentes al legado: línea de producto, almacén, rango de fechas, buscador).
  readonly idLineaProducto = new FormControl<number | null>(null);
  readonly idAlmacen = new FormControl<number | null>(null);
  readonly hoy = new Date();
  // Rango de fechas con mat-date-range-input (regla 18): default = hoy/hoy, visible en el
  // input desde la carga inicial; `hoy` como `[max]` para que el propio día de hoy nunca quede
  // excluido del calendario. El back solo usa `fechaFin` como corte, pero la UI igual envía
  // ambas (mismo criterio que el resto de pantallas migradas).
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

    this.productosService.obtenerLineas().subscribe({
      next: (lineas) => this.lineas.set(lineas),
      error: (err) => console.error('Error al cargar catálogo de líneas de producto', err),
    });

    this.usuariosService.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID).subscribe({
      next: (almacenes) => this.almacenes.set(almacenes),
      error: (err) => console.error('Error al cargar catálogo de almacenes', err),
    });

    this.cargar();
  }

  private get filtros(): Record<string, string | number | null> {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      q: this.search,
      idLineaProducto: this.idLineaProducto.value,
      idAlmacen: this.idAlmacen.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
    };
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('reportesInventario.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), ...this.filtros })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar el reporte de inventario', err);
          this.notify.notify('error', this.translate.instant('reportesInventario.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('reportesInventario.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar el reporte de inventario', err);
          this.notify.notify('error', this.translate.instant('reportesInventario.msg.loadError'));
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

  /** Botón "Buscar": aplica los filtros del formulario. */
  buscar(): void {
    this.cargar();
  }

  /** Botón "Limpiar": resetea filtros (rango de fechas vuelve a su default hoy/hoy). */
  limpiarFiltros(): void {
    this.idLineaProducto.reset();
    this.idAlmacen.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.search = '';
    this.cargar();
  }

  /**
   * "Reporte General" / "Reporte por Ubicación": exportan TODO el inventario ignorando los
   * filtros de pantalla (paridad legado, decisión explícita del usuario) — no se les pasa
   * `this.filtros`. El servicio resuelve la rama descarga vs. diferido y notifica.
   */
  exportar(tipo: 1 | 2): void {
    const clave = tipo === 1 ? 'general' : 'ubicacion';
    this.blockUIExportar.start(this.translate.instant(`reportesInventario.msg.exportando.${clave}`));
    this.service
      .exportar(tipo)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        error: (err) => console.error('Error al exportar el reporte de inventario', err),
      });
  }
}
