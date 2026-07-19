import { DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { Sort } from '@angular/material/sort';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Observable, finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Bitacora } from 'src/app/admin/models/bitacoras/bitacora';
import { BitacorasService } from 'src/app/admin/services/bitacoras.service';
import { ProductosService } from 'src/app/admin/services/productos.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';
import {
  BitacoraDetalleData,
  BitacoraDetalleDialogComponent,
} from '../../components/bitacora-detalle-dialog/bitacora-detalle-dialog.component';

/**
 * Pantalla "Bitácoras": consulta de solo lectura de pedidos internos (traspasos de producto
 * entre almacenes). Migra la vista Bitacoras.cshtml del legado (filtros folio/almacén
 * origen-destino/usuario/estatus/producto/rango de fechas + grid) y su detalle expandible, que
 * aquí se presenta como diálogo de línea de tiempo (BitacoraDetalleDialog). Sin buscador de
 * texto libre (regla 13 no aplica: filtros estructurados). Exportación diferida.
 */
@Component({
  selector: 'app-bitacoras-list',
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
    SelectPaginadoComponent,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './bitacoras-list.component.html',
  styleUrl: './bitacoras-list.component.scss',
})
export class BitacorasListComponent implements OnInit {
  private readonly service = inject(BitacorasService);
  private readonly productosService = inject(ProductosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  @BlockUI('bitacoras') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'idPedidoInterno',
    'almacenOrigen',
    'almacenDestino',
    'nombreCompleto',
    'descripcionProducto',
    'cantidad',
    'fechaAlta',
    'descripcionEstatus',
    'action',
  ];

  readonly pag = new Paginador<Bitacora>(CONSTANTS.PAGINATION.PAGE_SIZE);

  readonly estatus = signal<Catalogo[]>([]);
  readonly almacenes = signal<Catalogo[]>([]);

  /** Chip outline con color determinístico por estatus (regla 10). */
  private readonly estatusPalette = ['#5d87ff', '#13deb9', '#e53935', '#2e7d32', '#7b8893', '#ffae1f'];

  // Filtros (equivalentes al legado: folio, almacén origen/destino, usuario, estatus, producto,
  // rango de fechas). Usuario y Producto son catálogos grandes → selector paginado (regla 16).
  readonly idPedidoInterno = new FormControl<number | null>(null);
  readonly idAlmacenOrigen = new FormControl<number | null>(null);
  readonly idAlmacenDestino = new FormControl<number | null>(null);
  readonly idUsuario = new FormControl<number | null>(null);
  readonly idEstatusPedidoInterno = new FormControl<number | null>(null);
  readonly idProducto = new FormControl<number | null>(null);
  readonly hoy = new Date();
  // Rango de fechas con mat-date-range-input (regla 18): default = hoy/hoy, visible desde la
  // carga inicial; `hoy` como `[max]` para que el propio día de hoy nunca quede excluido.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  /** Orden server-side whitelisteado por la API: folio | fecha | cantidad. */
  private order: string | null = null;
  private sort: 'asc' | 'desc' | null = null;

  // fetchPage para los selectores paginados (regla 16): Usuario y Producto son catálogos grandes.
  readonly fetchUsuarios = (q: string, page: number): Observable<unknown[]> =>
    this.usuariosService.buscarPaginado(q, page);
  readonly fetchProductos = (q: string, page: number): Observable<unknown[]> =>
    this.productosService.buscarPaginado(q, page);

  ngOnInit(): void {
    this.service.obtenerEstatus().subscribe({
      next: (estatus) => this.estatus.set(estatus),
      error: (err) => console.error('Error al cargar catálogo de estatus', err),
    });

    // Almacenes de la sucursal por defecto (Uruapan, regla 15). Catálogo finito → ng-select.
    this.usuariosService.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID).subscribe({
      next: (almacenes) => this.almacenes.set(almacenes),
      error: (err) => console.error('Error al cargar almacenes', err),
    });

    this.cargar();
  }

  private get filtros(): Record<string, string | number | null> {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      idPedidoInterno: this.idPedidoInterno.value,
      idAlmacenOrigen: this.idAlmacenOrigen.value,
      idAlmacenDestino: this.idAlmacenDestino.value,
      idUsuario: this.idUsuario.value,
      idEstatusPedidoInterno: this.idEstatusPedidoInterno.value,
      idProducto: this.idProducto.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
      order: this.order,
      sort: this.sort,
    };
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('bitacoras.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), ...this.filtros })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar bitácoras', err);
          this.notify.notify('error', this.translate.instant('bitacoras.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('bitacoras.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar bitácoras', err);
          this.notify.notify('error', this.translate.instant('bitacoras.msg.loadError'));
        },
      });
  }

  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.cargar();
  }

  /** Orden server-side: el id del mat-sort-header ya es la columna whitelisteada de la API. */
  onSort(sortState: Sort): void {
    if (sortState.direction) {
      this.order = sortState.active;
      this.sort = sortState.direction;
    } else {
      this.order = null;
      this.sort = null;
    }
    this.cargar();
  }

  /** Color del chip de estatus (regla 10), determinístico por id de estatus. */
  estatusColor(idStatus: number): string {
    return this.estatusPalette[Math.abs(idStatus) % this.estatusPalette.length];
  }

  /** Abre el diálogo con la línea de tiempo (bitácora) del folio. */
  verDetalle(bitacora: Bitacora): void {
    this.dialog.open(BitacoraDetalleDialogComponent, {
      data: { idPedidoInterno: bitacora.idPedidoInterno } satisfies BitacoraDetalleData,
      width: '640px',
      maxWidth: '95vw',
    });
  }

  /** Botón "Buscar": aplica los filtros del formulario. */
  buscar(): void {
    this.cargar();
  }

  /** Botón "Limpiar": resetea filtros (rango de fechas vuelve a su default hoy/hoy). */
  limpiarFiltros(): void {
    this.idPedidoInterno.reset();
    this.idAlmacenOrigen.reset();
    this.idAlmacenDestino.reset();
    this.idUsuario.reset();
    this.idEstatusPedidoInterno.reset();
    this.idProducto.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.cargar();
  }
}
