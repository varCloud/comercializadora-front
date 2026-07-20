import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { MermaItem } from 'src/app/admin/models/reportes-merma/merma-item';
import { ReportesMermaService } from 'src/app/admin/services/reportes-merma.service';
import { ProductosService } from 'src/app/admin/services/productos.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';

/**
 * Pantalla "Reportes > Merma". Migra `ReportesController.Merma/ObtenerMerma/ObtenerMesesAnio`
 * del legado: listado paginado con filtros Año/Mes (cascada)/Almacén/Línea de Producto + un
 * botón de exportación que respeta los filtros activos (mismo criterio que Ventas, a diferencia
 * de Inventario). Catálogos de Almacén/Línea reusados de `UsuariosService`/`ProductosService`
 * (regla 00), mismos que Ventas/Inventario — sin endpoints nuevos (ver hallazgo en la HU: el
 * catálogo legado `ObtenerLineasAlmacen(0)` es funcionalmente idéntico al ya reusado). Sin
 * buscador de texto libre (paridad con el resto del módulo Reportes, sin modernizar).
 *
 * **Cascada Año→Mes** (fiel al legado `ObtenerMesesAnio`): el catálogo de Mes depende del Año
 * elegido (`obtenerMeses(anio)`). Como `anio` es opcional en la API (sin él, el propio SP calcula
 * con el año actual), la pantalla arranca con el **año actual preseleccionado y sus meses ya
 * cargados** — evita la UX de un selector de Mes vacío/deshabilitado en la carga inicial. El
 * selector de Año no es "limpiable" (`clearable=false`): siempre hay un año válido seleccionado,
 * igual que hace el propio SP al recibir `anioCalculo` nulo. Al cambiar el Año, se resetea la
 * selección de Mes y se vuelve a pedir su catálogo (cascada) + la consulta.
 */
@Component({
  selector: 'app-merma-list',
  standalone: true,
  imports: [
    MaterialModule,
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
  templateUrl: './merma-list.component.html',
})
export class MermaListComponent implements OnInit {
  private readonly service = inject(ReportesMermaService);
  private readonly productosService = inject(ProductosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('reportesMerma') blockUI!: NgBlockUI;
  /** Bloque propio para la exportación (no bloquea/depende del listado). */
  @BlockUI('reportesMermaExportar') blockUIExportar!: NgBlockUI;

  readonly displayedColumns = [
    'fechaAlta',
    'codigoBarras',
    'descripcionProducto',
    'descripcionLinea',
    'inventarioFinalMesAnt',
    'totalCompras',
    'inventarioSistema',
    'merma',
    'porcMerma',
    'ultCostoCompra',
    'costoMerma',
    'ultimoDiaMesCalculo',
    'ultimoDiaMesAnterior',
  ];

  readonly pag = new Paginador<MermaItem>(CONSTANTS.PAGINATION.PAGE_SIZE);

  readonly anios = signal<Catalogo[]>([]);
  readonly meses = signal<Catalogo[]>([]);
  readonly almacenes = signal<Catalogo[]>([]);
  readonly lineas = signal<Catalogo[]>([]);

  private readonly anioActual = new Date().getFullYear();

  // Filtros (equivalentes al legado: año/mes de cálculo -cascada-, almacén, línea de producto).
  readonly anioCalculo = new FormControl<number | null>(this.anioActual, { nonNullable: true });
  readonly mesCalculo = new FormControl<number | null>(null);
  readonly idAlmacen = new FormControl<number | null>(null);
  readonly idLineaProducto = new FormControl<number | null>(null);

  ngOnInit(): void {
    this.service.obtenerAnios().subscribe({
      next: (a) => this.anios.set(a),
      error: (err) => console.error('Error al cargar catálogo de años', err),
    });

    this.cargarMeses(this.anioActual);

    this.usuariosService.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID).subscribe({
      next: (a) => this.almacenes.set(a),
      error: (err) => console.error('Error al cargar catálogo de almacenes', err),
    });

    this.productosService.obtenerLineas().subscribe({
      next: (l) => this.lineas.set(l),
      error: (err) => console.error('Error al cargar catálogo de líneas de producto', err),
    });

    this.cargar();
  }

  /** Recarga el catálogo de Mes para el Año dado (cascada Año→Mes). */
  private cargarMeses(anio: number | null): void {
    this.service.obtenerMeses(anio).subscribe({
      next: (m) => this.meses.set(m),
      error: (err) => console.error('Error al cargar catálogo de meses', err),
    });
  }

  /** Cambió el filtro Año: resetea Mes, recarga su catálogo (cascada) y vuelve a consultar. */
  onAnioChange(): void {
    this.mesCalculo.reset(null);
    this.cargarMeses(this.anioCalculo.value);
    this.cargar();
  }

  private get filtros() {
    return {
      anioCalculo: this.anioCalculo.value,
      mesCalculo: this.mesCalculo.value,
      idAlmacen: this.idAlmacen.value,
      idLineaProducto: this.idLineaProducto.value,
    };
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('reportesMerma.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), ...this.filtros })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar el reporte de merma', err);
          this.notify.notify('error', this.translate.instant('reportesMerma.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('reportesMerma.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar el reporte de merma', err);
          this.notify.notify('error', this.translate.instant('reportesMerma.msg.loadError'));
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

  /** Botón "Limpiar": Año vuelve al actual (con sus meses recargados), el resto a "Todos". */
  limpiarFiltros(): void {
    this.idAlmacen.reset();
    this.idLineaProducto.reset();
    this.anioCalculo.setValue(this.anioActual);
    this.mesCalculo.reset(null);
    this.cargarMeses(this.anioActual);
    this.cargar();
  }

  /** Exporta con los filtros activos (mismo criterio que Ventas: no ignora la pantalla). */
  exportar(): void {
    this.blockUIExportar.start(this.translate.instant('reportesMerma.msg.exportando'));
    this.service
      .exportar(this.filtros)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        error: (err) => console.error('Error al exportar el reporte de merma', err),
      });
  }
}
