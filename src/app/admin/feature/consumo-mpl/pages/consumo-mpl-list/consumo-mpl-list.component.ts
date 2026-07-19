import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { CostoProduccionAgranel } from 'src/app/admin/models/consumo-mpl/costo-produccion-agranel';
import { ConsumoMplService } from 'src/app/admin/services/consumo-mpl.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';
import { ProductosService } from 'src/app/admin/services/productos.service';

/**
 * Pantalla "Consumo de MPL" (nombre técnico legado "Costo de Producción Agranel"). Migra
 * `Views/Reportes/CostoProduccionAgranel.cshtml` + `_ObtenerCostoProduccion.cshtml`: reporte de
 * solo lectura (sin altas/ediciones/exportar) con filtros cascada Año→Mes y Almacén→Línea de
 * producto + buscador de producto (regla 13). "Cantidad Restante" no viaja de la API: se calcula
 * en el modelo (`CostoProduccionAgranelModel.cantidadRestanteMesAnt`), igual que la vista legada.
 * Sin selector de Sucursal visible (regla 15): el catálogo de Almacenes se pide fijo con
 * `CONSTANTS.SUCURSAL_DEFAULT.ID` (Uruapan).
 */
@Component({
  selector: 'app-consumo-mpl-list',
  standalone: true,
  imports: [
    FormsModule,
    NgSelectModule,
    MaterialModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    PaginadorComponent,
    CurrencyPipe,
    DecimalPipe,
  ],
  templateUrl: './consumo-mpl-list.component.html',
})
export class ConsumoMplListComponent implements OnInit {
  private readonly service = inject(ConsumoMplService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly productosService = inject(ProductosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('consumoMpl') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'idProducto',
    'codigoBarras',
    'descripcionProducto',
    'descripcionLinea',
    'cantidadSolicitadaMesAnt',
    'cantidadAceptadaFinalMesAnt',
    'cantidadRestanteMesAnt',
    'ultCostoCompra',
    'costoProduccionMerma',
  ];

  readonly pag = new Paginador<CostoProduccionAgranel>(CONSTANTS.PAGINATION.PAGE_SIZE);

  // Catálogos de los filtros.
  readonly anios = signal<Catalogo[]>([]);
  readonly meses = signal<Catalogo[]>([]);
  readonly almacenes = signal<Catalogo[]>([]);
  readonly lineas = signal<Catalogo[]>([]);

  // Estado de los filtros (0 = TODOS, misma semántica que el legado/API).
  anioCalculo = 0;
  mesCalculo = 0;
  idAlmacen = 0;
  idLineaProducto = 0;

  private search = '';
  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((value) => {
        this.search = value;
        this.cargar();
      });

    this.service.obtenerAnios().subscribe({
      next: (a) => this.anios.set(a),
      error: (err) => console.error('Error al cargar catálogo de años', err),
    });
    this.cargarMeses();

    // Almacenes: reusa UsuariosService (regla 00), fijo a la sucursal Uruapan (regla 15). Este
    // filtro de Almacén no es el "selector de sucursal" de la regla 15 (no existe uno visible
    // en esta pantalla); solo el catálogo depende internamente de idSucursal.
    this.usuariosService.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID).subscribe({
      next: (a) => this.almacenes.set(a),
      error: (err) => console.error('Error al cargar catálogo de almacenes', err),
    });
    this.cargarLineas();

    this.cargar();
  }

  /** Recarga el catálogo de Mes para el Año seleccionado (0/TODOS = todos los meses). */
  private cargarMeses(): void {
    this.service.obtenerMeses(this.anioCalculo || null).subscribe({
      next: (m) => this.meses.set(m),
      error: (err) => console.error('Error al cargar catálogo de meses', err),
    });
  }

  /** Recarga el catálogo de Línea para el Almacén seleccionado (0/TODOS = todas las líneas). */
  private cargarLineas(): void {
    this.productosService.obtenerLineas(this.idAlmacen || undefined).subscribe({
      next: (l) => this.lineas.set(l),
      error: (err) => console.error('Error al cargar catálogo de líneas', err),
    });
  }

  /** Cambió el filtro Año: recarga el catálogo de Mes (cascada) y resetea Mes a TODOS. */
  onAnioChange(): void {
    this.mesCalculo = 0;
    this.cargarMeses();
    this.cargar();
  }

  /** Cambió el filtro Almacén: recarga el catálogo de Línea (cascada) y resetea Línea a TODOS. */
  onAlmacenChange(): void {
    this.idLineaProducto = 0;
    this.cargarLineas();
    this.cargar();
  }

  /** Cambió el filtro Mes o Línea: recarga desde la página 1. */
  onFiltroChange(): void {
    this.cargar();
  }

  applyFilter(value: string): void {
    this.search$.next(value);
  }

  /** Primera consulta / recarga desde la página 1 (al buscar o cambiar filtros/tamaño). */
  cargar(): void {
    this.fetch(1);
  }

  /** Navegación por links (first/prev/next/last). */
  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('consumoMpl.msg.loading'));
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

  private fetch(page: number): void {
    this.blockUI.start(this.translate.instant('consumoMpl.msg.loading'));
    this.service
      .listar({
        page,
        perPage: this.pag.perPage(),
        q: this.search,
        anioCalculo: this.anioCalculo,
        mesCalculo: this.mesCalculo,
        idAlmacen: this.idAlmacen,
        idLineaProducto: this.idLineaProducto,
      })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => this.errorListado(err),
      });
  }

  private errorListado(err: unknown): void {
    console.error('Error al listar consumo de MPL', err);
    this.notify.notify('error', this.translate.instant('consumoMpl.msg.loadError'));
  }
}
