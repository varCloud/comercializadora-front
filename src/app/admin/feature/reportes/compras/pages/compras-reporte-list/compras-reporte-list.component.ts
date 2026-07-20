import { CurrencyPipe, DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
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
import { CompraReporteItem } from 'src/app/admin/models/reportes-compras/compra-reporte-item';
import { ReportesComprasService } from 'src/app/admin/services/reportes-compras.service';

/**
 * Pantalla "Reportes > Compras". Migra `ReportesController.BuscarCompras` +
 * `ComprasDAO.ObtenerCompras(detalleCompra: true)` del legado, resumido por compra (una fila por
 * compra; `totalCantProductos` reemplaza el detalle línea a línea con un conteo). Filtros:
 * Proveedor, Línea de producto, Comprador (usuario), Estatus, rango de fechas — todos opcionales
 * e independientes, sin cascadas. Listado paginado server-side desde el día uno
 * (`SP_V2_CONSULTA_COMPRAS_REPORTE`, hermano de `SP_V2_CONSULTA_COMPRAS` del CRUD) + exportación
 * CSV que respeta los filtros activos (mismo criterio que Ventas/Merma/Devoluciones).
 *
 * **Catálogos propios del reporte (decisión, reglas 00/16):** a diferencia de otros
 * sub-reportes (que reusan `ProveedoresService`/`UsuariosService`/`ProductosService`), la API
 * expone catálogos dedicados SIN paginar (`/reportes/compras/proveedores|lineas|compradores|
 * estatus`, `Notificacion<CatalogoItem[]>` — ya aprobados en el bloque API). Al no existir un
 * endpoint paginado para consumir, Proveedor (~153) y Comprador se cargan completos en un
 * `ng-select` con filtro cliente, igual que Línea de producto — desviación puntual del umbral de
 * `app-select-paginado` de la regla 16 (no aplica: no hay paginación server-side que pedir).
 * Estatus (catálogo chico, ~4) usa `mat-select`.
 */
@Component({
  selector: 'app-compras-reporte-list',
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
  templateUrl: './compras-reporte-list.component.html',
  styleUrl: './compras-reporte-list.component.scss',
})
export class ComprasReporteListComponent implements OnInit {
  private readonly service = inject(ReportesComprasService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('reportesCompras') blockUI!: NgBlockUI;
  /** Bloque propio para la exportación (no bloquea/depende del listado). */
  @BlockUI('reportesComprasExportar') blockUIExportar!: NgBlockUI;

  readonly displayedColumns = [
    'idCompra',
    'fechaAlta',
    'proveedor',
    'comprador',
    'estatus',
    'productos',
    'montoTotal',
  ];

  readonly pag = new Paginador<CompraReporteItem>(CONSTANTS.PAGINATION.PAGE_SIZE);
  readonly proveedores = signal<Catalogo[]>([]);
  readonly lineas = signal<Catalogo[]>([]);
  readonly compradores = signal<Catalogo[]>([]);
  readonly estatusList = signal<Catalogo[]>([]);

  /** Chip outline con color determinístico por estatus (regla 10). Paridad con `compras-list`
   *  (CRUD): 1 Pendiente (gris), 2 Realizada (azul), 3 Finalizada (verde), 4 Cancelada (rojo). */
  private readonly estatusPalette: Record<number, string> = {
    1: '#7b8893',
    2: '#539bff',
    3: '#13deb9',
    4: '#e53935',
  };

  // Filtros (equivalentes al legado: proveedor, línea, comprador, estatus, rango de fechas).
  readonly idProveedor = new FormControl<number | null>(null);
  readonly idLineaProducto = new FormControl<number | null>(null);
  readonly idUsuario = new FormControl<number | null>(null);
  readonly idStatusCompra = new FormControl<number | null>(null);
  readonly hoy = new Date();
  // Rango de fechas con mat-date-range-input (regla 18): default = hoy/hoy, visible desde la
  // carga inicial; `hoy` como `[max]` para que el propio día de hoy nunca quede excluido.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  ngOnInit(): void {
    this.service.obtenerProveedores().subscribe({
      next: (lista) => this.proveedores.set(lista),
      error: (err) => console.error('Error al cargar catálogo de proveedores', err),
    });
    this.service.obtenerLineas().subscribe({
      next: (lista) => this.lineas.set(lista),
      error: (err) => console.error('Error al cargar catálogo de líneas de producto', err),
    });
    this.service.obtenerCompradores().subscribe({
      next: (lista) => this.compradores.set(lista),
      error: (err) => console.error('Error al cargar catálogo de compradores', err),
    });
    this.service.obtenerEstatus().subscribe({
      next: (lista) => this.estatusList.set(lista),
      error: (err) => console.error('Error al cargar catálogo de estatus de compra', err),
    });

    this.cargar();
  }

  private get filtros() {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      idProveedor: this.idProveedor.value,
      idLineaProducto: this.idLineaProducto.value,
      idUsuario: this.idUsuario.value,
      idStatusCompra: this.idStatusCompra.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
    };
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('reportesCompras.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), ...this.filtros })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar el reporte de compras', err);
          this.notify.notify('error', this.translate.instant('reportesCompras.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('reportesCompras.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar el reporte de compras', err);
          this.notify.notify('error', this.translate.instant('reportesCompras.msg.loadError'));
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

  /** Botón "Limpiar": resetea filtros (rango de fechas vuelve a su default hoy/hoy). */
  limpiarFiltros(): void {
    this.idProveedor.reset();
    this.idLineaProducto.reset();
    this.idUsuario.reset();
    this.idStatusCompra.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.cargar();
  }

  /** Color del chip de estatus (regla 10), determinístico por id de estatus. */
  estatusColor(idStatus: number): string {
    return this.estatusPalette[idStatus] ?? '#7b8893';
  }

  /** Exporta con los filtros activos (mismo criterio que Ventas/Merma/Devoluciones). */
  exportar(): void {
    this.blockUIExportar.start(this.translate.instant('reportesCompras.msg.exportando'));
    this.service
      .exportar(this.filtros)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        error: (err) => console.error('Error al exportar el reporte de compras', err),
      });
  }
}
