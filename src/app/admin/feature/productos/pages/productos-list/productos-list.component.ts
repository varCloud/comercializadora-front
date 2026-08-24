import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NgSelectModule } from '@ng-select/ng-select';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL } from 'src/app/models/result-modal';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Producto } from 'src/app/admin/models/productos/producto';
import { ProductoCodigoBarraModel } from 'src/app/admin/models/productos/producto-codigo-barra';
import { ProductosService } from 'src/app/admin/services/productos.service';
import {
  ProductoFormData,
  ProductoFormDialogComponent,
} from '../../components/producto-form-dialog/producto-form-dialog.component';
import {
  PreciosFormData,
  PreciosFormDialogComponent,
} from '../../components/precios-form-dialog/precios-form-dialog.component';
import {
  UbicacionesProductoDialogData,
  UbicacionesProductoDialogComponent,
} from '../../components/ubicaciones-producto-dialog/ubicaciones-producto-dialog.component';

@Component({
  selector: 'app-productos-list',
  standalone: true,
  imports: [
    MaterialModule,
    FormsModule,
    NgSelectModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    PaginadorComponent,
    CurrencyPipe,
    DecimalPipe,
  ],
  templateUrl: './productos-list.component.html',
  styles: [
    `.mat-mdc-cell.mat-table-sticky,
     .mat-mdc-header-cell.mat-table-sticky {
      background-color: var(--mat-sys-surface, #fff);
    }`,
  ],
})
export class ProductosListComponent implements OnInit {
  private readonly service = inject(ProductosService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('productos') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'descripcion',
    'linea',
    'articulo',
    'precioMayoreo',
    'precio',
    'utilidadMenudeo',
    'utilidadMayoreo',
    'unidadCompra',
    'cantidadUnidadCompra',
    'ultimoCosto',
    'action',
  ];

  readonly pag = new Paginador<Producto>(CONSTANTS.PAGINATION.PAGE_SIZE);

  /** Catálogo de líneas para el filtro (≤25 → ng-select con filtro cliente, regla 16). */
  readonly lineas = signal<Catalogo[]>([]);
  /** 0 = todas las líneas. */
  idLinea = 0;

  private search = '';
  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((value) => {
        this.search = value;
        this.cargar();
      });
    this.service.obtenerLineas().subscribe((lineas) => this.lineas.set(lineas));
    this.cargar();
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('productos.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), q: this.search, idLineaProducto: this.idLinea })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar productos', err);
          this.notify.notify('error', this.translate.instant('productos.msg.loadError'));
        },
      });
  }

  /** Cambió el filtro de Línea de Producto → recargar desde la página 1. */
  onFiltroChange(): void {
    this.cargar();
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('productos.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar productos', err);
          this.notify.notify('error', this.translate.instant('productos.msg.loadError'));
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

  agregar(): void {
    this.abrirFormulario({});
  }

  editar(producto: Producto): void {
    this.abrirFormulario({ producto });
  }

  precios(producto: Producto): void {
    const data: PreciosFormData = { producto };
    const ref = this.dialog.open(PreciosFormDialogComponent, {
      data,
      width: '1000px',
      maxWidth: '95vw',
      disableClose: true,
    });
    ref.afterClosed().subscribe((res) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) {
        this.cargar();
      }
    });
  }

  /** Abre "Ubicaciones del producto" (hallazgo P-01, consulta + ajuste de existencia física). */
  ubicaciones(producto: Producto): void {
    const data: UbicacionesProductoDialogData = {
      idProducto: producto.idProducto,
      descripcion: producto.descripcion,
    };
    this.dialog.open(UbicacionesProductoDialogComponent, {
      data,
      width: '1000px',
      maxWidth: '95vw',
    });
  }

  /** Imprimir Códigos de este producto (1 clic, PDF de barra+QR igual que el generador masivo). */
  imprimirCodigos(producto: Producto): void {
    const payload = [ProductoCodigoBarraModel.fromProducto(producto)];
    this.blockUI.start(this.translate.instant('productos.codigosBarras.msg.generando'));
    this.service
      .generarCodigosBarras(payload)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (blob) => this.abrirPdf(blob),
        error: (err) => {
          console.error('Error al generar el PDF de códigos de barras', err);
          this.notify.notify('error', this.translate.instant('productos.msg.printCodesError'));
        },
      });
  }

  private abrirPdf(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  // ── % Utilidad de columnas (migrado 1:1 de la fórmula de precios-form-dialog) ──

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  private calcPorcUtilidad(costo: number, precio: number): number {
    if (costo > 0 && precio > 0) return this.round2((precio * 100) / costo - 100);
    return 0;
  }

  /** % Utilidad Menudeo = costo vs. precioIndividual ("Precio Menudeo" en el legado). */
  utilidadMenudeo(p: Producto): number {
    return this.calcPorcUtilidad(p.ultimoCostoCompra ?? 0, p.precioIndividual ?? 0);
  }

  /** % Utilidad Mayoreo = costo vs. precioMenudeo ("Precio Mayoreo" en el legado). */
  utilidadMayoreo(p: Producto): number {
    return this.calcPorcUtilidad(p.ultimoCostoCompra ?? 0, p.precioMenudeo ?? 0);
  }

  eliminar(producto: Producto): void {
    Swal.fire({
      title: this.translate.instant('productos.confirm.deleteTitle'),
      text: this.translate.instant('productos.confirm.deleteText', {
        nombre: producto.descripcion?.trim(),
      }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('productos.confirm.accept'),
      cancelButtonText: this.translate.instant('productos.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.blockUI.start();
      this.service
        .cambiarEstatus(producto.idProducto, false)
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
              this.cargar();
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('productos.msg.deleteFallback'),
              );
            }
          },
          error: (err) => {
            console.error('Error al eliminar producto', err);
            this.notify.notify('error', this.translate.instant('productos.msg.deleteError'));
          },
        });
    });
  }

  private abrirFormulario(data: ProductoFormData): void {
    const ref = this.dialog.open(ProductoFormDialogComponent, {
      data,
      width: '900px',
      maxWidth: '95vw',
      disableClose: true,
    });

    ref.afterClosed().subscribe((res) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) {
        this.cargar();
      }
    });
  }
}
