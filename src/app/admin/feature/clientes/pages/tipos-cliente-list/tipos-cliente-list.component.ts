import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
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
import { TipoCliente } from 'src/app/admin/models/clientes/tipo-cliente';
import { TiposClienteService } from 'src/app/admin/services/tipos-cliente.service';
import {
  TipoClienteFormData,
  TipoClienteFormDialogComponent,
} from '../../components/tipo-cliente-form-dialog/tipo-cliente-form-dialog.component';

@Component({
  selector: 'app-tipos-cliente-list',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, BlockUIModule, TranslatePipe, PaginadorComponent, DecimalPipe],
  templateUrl: './tipos-cliente-list.component.html',
  styleUrl: './tipos-cliente-list.component.scss',
})
export class TiposClienteListComponent implements OnInit {
  private readonly service = inject(TiposClienteService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('tipos-cliente') blockUI!: NgBlockUI;

  readonly displayedColumns = ['descripcion', 'descuento', 'action'];

  readonly pag = new Paginador<TipoCliente>(CONSTANTS.PAGINATION.PAGE_SIZE);

  private search = '';
  /** Orden server-side whitelisteado por la API: descripcion | descuento. */
  private order: string | null = null;
  private sort: 'asc' | 'desc' | null = null;
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
    this.blockUI.start(this.translate.instant('tiposCliente.msg.loading'));
    this.service
      .listar({
        perPage: this.pag.perPage(),
        q: this.search,
        order: this.order,
        sort: this.sort,
      })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar tipos de cliente', err);
          this.notify.notify('error', this.translate.instant('tiposCliente.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('tiposCliente.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar tipos de cliente', err);
          this.notify.notify('error', this.translate.instant('tiposCliente.msg.loadError'));
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

  /** Orden server-side: el id del mat-sort-header es la columna whitelisteada de la API. */
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

  agregar(): void {
    this.abrirFormulario({});
  }

  editar(tipo: TipoCliente): void {
    this.abrirFormulario({ tipo });
  }

  ver(tipo: TipoCliente): void {
    this.abrirFormulario({ tipo, readonly: true });
  }

  eliminar(tipo: TipoCliente): void {
    Swal.fire({
      title: this.translate.instant('tiposCliente.confirm.deleteTitle'),
      text: this.translate.instant('tiposCliente.confirm.deleteText', {
        nombre: tipo.descripcion?.trim(),
      }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('tiposCliente.confirm.accept'),
      cancelButtonText: this.translate.instant('tiposCliente.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.blockUI.start();
      this.service
        .cambiarEstatus(tipo.idTipoCliente, false)
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
              this.cargar();
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('tiposCliente.msg.deleteFallback'),
              );
            }
          },
          error: (err) => {
            console.error('Error al desactivar tipo de cliente', err);
            this.notify.notify('error', this.translate.instant('tiposCliente.msg.deleteError'));
          },
        });
    });
  }

  private abrirFormulario(data: TipoClienteFormData): void {
    const ref = this.dialog.open(TipoClienteFormDialogComponent, {
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
