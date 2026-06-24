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
import { LineaProducto } from 'src/app/admin/models/productos/linea-producto';
import { LineasProductoService } from 'src/app/admin/services/lineas-producto.service';
import {
  LineaFormData,
  LineaFormDialogComponent,
} from '../../components/linea-form-dialog/linea-form-dialog.component';

@Component({
  selector: 'app-lineas-list',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, BlockUIModule, TranslatePipe, PaginadorComponent],
  templateUrl: './lineas-list.component.html',
  styleUrl: './lineas-list.component.scss',
})
export class LineasListComponent implements OnInit {
  private readonly service = inject(LineasProductoService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('lineas') blockUI!: NgBlockUI;

  readonly displayedColumns = ['descripcion', 'action'];

  readonly pag = new Paginador<LineaProducto>(CONSTANTS.PAGINATION.PAGE_SIZE);

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
    this.blockUI.start(this.translate.instant('lineasProducto.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), q: this.search })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar líneas de producto', err);
          this.notify.notify('error', this.translate.instant('lineasProducto.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('lineasProducto.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar líneas de producto', err);
          this.notify.notify('error', this.translate.instant('lineasProducto.msg.loadError'));
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

  editar(linea: LineaProducto): void {
    this.abrirFormulario({ linea });
  }

  ver(linea: LineaProducto): void {
    this.abrirFormulario({ linea, readonly: true });
  }

  eliminar(linea: LineaProducto): void {
    Swal.fire({
      title: this.translate.instant('lineasProducto.confirm.deleteTitle'),
      text: this.translate.instant('lineasProducto.confirm.deleteText', {
        nombre: linea.descripcion?.trim(),
      }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('lineasProducto.confirm.accept'),
      cancelButtonText: this.translate.instant('lineasProducto.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.blockUI.start();
      this.service
        .cambiarEstatus(linea.idLineaProducto, false)
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
              this.cargar();
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('lineasProducto.msg.deleteFallback'),
              );
            }
          },
          error: (err) => {
            console.error('Error al desactivar línea de producto', err);
            this.notify.notify('error', this.translate.instant('lineasProducto.msg.deleteError'));
          },
        });
    });
  }

  private abrirFormulario(data: LineaFormData): void {
    const ref = this.dialog.open(LineaFormDialogComponent, {
      data,
      width: '600px',
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
