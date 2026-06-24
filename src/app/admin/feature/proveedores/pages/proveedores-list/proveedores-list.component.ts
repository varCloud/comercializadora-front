import { DecimalPipe } from '@angular/common';
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
import { Proveedor } from 'src/app/admin/models/proveedores/proveedor';
import { ProveedoresService } from 'src/app/admin/services/proveedores.service';
import {
  ProveedorFormData,
  ProveedorFormDialogComponent,
} from '../../components/proveedor-form-dialog/proveedor-form-dialog.component';

@Component({
  selector: 'app-proveedores-list',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, BlockUIModule, TranslatePipe, PaginadorComponent, DecimalPipe],
  templateUrl: './proveedores-list.component.html',
  styles: [
    `.mat-mdc-cell.mat-table-sticky,
     .mat-mdc-header-cell.mat-table-sticky {
      background-color: var(--mat-sys-surface, #fff);
    }`,
  ],
})
export class ProveedoresListComponent implements OnInit {
  private readonly service = inject(ProveedoresService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('proveedores') blockUI!: NgBlockUI;

  readonly displayedColumns = ['nombre', 'descripcion', 'telefono', 'direccion', 'porcAtendido', 'action'];

  readonly pag = new Paginador<Proveedor>(CONSTANTS.PAGINATION.PAGE_SIZE);

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
    this.blockUI.start(this.translate.instant('proveedores.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), q: this.search })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar proveedores', err);
          this.notify.notify('error', this.translate.instant('proveedores.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('proveedores.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar proveedores', err);
          this.notify.notify('error', this.translate.instant('proveedores.msg.loadError'));
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

  editar(proveedor: Proveedor): void {
    this.abrirFormulario({ proveedor });
  }

  ver(proveedor: Proveedor): void {
    this.abrirFormulario({ proveedor, readonly: true });
  }

  eliminar(proveedor: Proveedor): void {
    Swal.fire({
      title: this.translate.instant('proveedores.confirm.deleteTitle'),
      text: this.translate.instant('proveedores.confirm.deleteText', {
        nombre: proveedor.nombre?.trim(),
      }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('proveedores.confirm.accept'),
      cancelButtonText: this.translate.instant('proveedores.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.blockUI.start();
      this.service
        .cambiarEstatus(proveedor.idProveedor, false)
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
              this.cargar();
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('proveedores.msg.deleteFallback'),
              );
            }
          },
          error: (err) => {
            console.error('Error al eliminar proveedor', err);
            this.notify.notify('error', this.translate.instant('proveedores.msg.deleteError'));
          },
        });
    });
  }

  private abrirFormulario(data: ProveedorFormData): void {
    const ref = this.dialog.open(ProveedorFormDialogComponent, {
      data,
      width: '700px',
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
