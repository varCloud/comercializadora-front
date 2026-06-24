import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
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
import { Producto } from 'src/app/admin/models/productos/producto';
import { ProductosService } from 'src/app/admin/services/productos.service';
import {
  ProductoFormData,
  ProductoFormDialogComponent,
} from '../../components/producto-form-dialog/producto-form-dialog.component';
import {
  PreciosFormData,
  PreciosFormDialogComponent,
} from '../../components/precios-form-dialog/precios-form-dialog.component';

@Component({
  selector: 'app-productos-list',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, BlockUIModule, TranslatePipe, PaginadorComponent, CurrencyPipe],
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

  readonly displayedColumns = ['descripcion', 'articulo', 'codigoBarras', 'linea', 'unidad', 'precio', 'action'];

  readonly pag = new Paginador<Producto>(CONSTANTS.PAGINATION.PAGE_SIZE);

  private search = '';
  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((value) => {
        this.search = value;
        this.cargar();
      });
    this.cargar();
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('productos.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), q: this.search })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar productos', err);
          this.notify.notify('error', this.translate.instant('productos.msg.loadError'));
        },
      });
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

  ver(producto: Producto): void {
    this.abrirFormulario({ producto, readonly: true });
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
