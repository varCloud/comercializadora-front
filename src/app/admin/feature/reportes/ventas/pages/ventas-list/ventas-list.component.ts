import { CurrencyPipe, DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Observable, finalize, map } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { VentaReporteItem } from 'src/app/admin/models/reportes-ventas/venta-reporte-item';
import { ReportesVentasService } from 'src/app/admin/services/reportes-ventas.service';
import { ProductosService } from 'src/app/admin/services/productos.service';
import { ClientesService } from 'src/app/admin/services/clientes.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';

/**
 * Pantalla "Reportes > Ventas". Migra `ReportesController.Ventas/BuscarVentas` del legado:
 * listado con filtros Línea de Producto/Cliente/Usuario/rango de fechas (regla 18, default
 * hoy/hoy) — **sin buscador de texto libre** (decisión transversal del módulo Reportes a
 * partir de este sub-reporte, sin modernizar) — + un botón de exportación que respeta los
 * filtros activos (a diferencia de Inventario). Catálogos reusados de
 * `ProductosService`/`ClientesService`/`UsuariosService` (regla 00), sin agregar métodos
 * nuevos a esos servicios.
 *
 * **Corrección post-aprobación (2026-07-19):** el listado pasó a ser **paginado server-side**
 * (`app-paginador` + `Paginador<T>`, regla 10) — excepción puntual a "sin modernizar": el SP
 * legado no se toca, pero un rango de fechas amplio podía traer miles de filas de golpe, así que
 * la API ahora pagina en memoria. El resto de la pantalla (filtros, buscador ausente, botón
 * Exportar) no cambió.
 */
@Component({
  selector: 'app-ventas-list',
  standalone: true,
  imports: [
    MaterialModule,
    MatNativeDateModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    NgSelectModule,
    SelectPaginadoComponent,
    PaginadorComponent,
    DatePipe,
    DecimalPipe,
    CurrencyPipe,
  ],
  templateUrl: './ventas-list.component.html',
})
export class VentasListComponent implements OnInit {
  private readonly service = inject(ReportesVentasService);
  private readonly productosService = inject(ProductosService);
  private readonly clientesService = inject(ClientesService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('reportesVentas') blockUI!: NgBlockUI;
  /** Bloque propio para la exportación (no bloquea/depende del listado). */
  @BlockUI('reportesVentasExportar') blockUIExportar!: NgBlockUI;

  readonly displayedColumns = [
    'fecha',
    'sucursal',
    'tienda',
    'cajero',
    'folio',
    'cliente',
    'codigoBarras',
    'lineaProducto',
    'producto',
    'cantidad',
    'precioVenta',
    'iva',
    'montoTotal',
    'costoCompra',
    'utilidad',
    'margenBruto',
    'formaPago',
  ];

  readonly pag = new Paginador<VentaReporteItem>(CONSTANTS.PAGINATION.PAGE_SIZE);
  readonly lineas = signal<Catalogo[]>([]);

  // Filtros (equivalentes al legado: línea de producto, cliente, usuario/cajero, rango de
  // fechas). Cliente/Usuario son catálogos grandes → selector paginado server-side (regla 16),
  // reusando ClientesService.listar/UsuariosService.buscarPaginado sin métodos nuevos.
  readonly idLineaProducto = new FormControl<number | null>(null);
  readonly idCliente = new FormControl<number | null>(null);
  readonly idUsuario = new FormControl<number | null>(null);
  readonly hoy = new Date();
  // Rango de fechas con mat-date-range-input (regla 18): default = hoy/hoy, visible desde la
  // carga inicial; `hoy` como `[max]` para que el propio día de hoy nunca quede excluido.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  // fetchPage para los selectores paginados de cliente/usuario (regla 16).
  readonly fetchClientes = (q: string, page: number): Observable<unknown[]> =>
    this.clientesService.listar({ q, page, perPage: 25 }).pipe(map((res) => res.data));

  readonly fetchUsuarios = (q: string, page: number): Observable<unknown[]> =>
    this.usuariosService.buscarPaginado(q, page);

  ngOnInit(): void {
    this.productosService.obtenerLineas().subscribe({
      next: (lineas) => this.lineas.set(lineas),
      error: (err) => console.error('Error al cargar catálogo de líneas de producto', err),
    });

    this.cargar();
  }

  private get filtros() {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      idLineaProducto: this.idLineaProducto.value,
      idCliente: this.idCliente.value,
      idUsuario: this.idUsuario.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
    };
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('reportesVentas.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), ...this.filtros })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar el reporte de ventas', err);
          this.notify.notify('error', this.translate.instant('reportesVentas.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('reportesVentas.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar el reporte de ventas', err);
          this.notify.notify('error', this.translate.instant('reportesVentas.msg.loadError'));
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
    this.idLineaProducto.reset();
    this.idCliente.reset();
    this.idUsuario.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.cargar();
  }

  /** Exporta con los filtros activos (a diferencia de Inventario, no ignora la pantalla). */
  exportar(): void {
    this.blockUIExportar.start(this.translate.instant('reportesVentas.msg.exportando'));
    this.service
      .exportar(this.filtros)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        error: (err) => console.error('Error al exportar el reporte de ventas', err),
      });
  }
}
