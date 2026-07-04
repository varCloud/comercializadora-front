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
import { Cliente } from 'src/app/admin/models/clientes/cliente';
import { ClientesService } from 'src/app/admin/services/clientes.service';
import {
  ClienteFormData,
  ClienteFormDialogComponent,
} from '../../components/cliente-form-dialog/cliente-form-dialog.component';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, BlockUIModule, TranslatePipe, PaginadorComponent],
  templateUrl: './clientes-list.component.html',
  styleUrl: './clientes-list.component.scss',
})
export class ClientesListComponent implements OnInit {
  private readonly service = inject(ClientesService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('clientes') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'nombreCompleto',
    'rfc',
    'telefono',
    'correo',
    'municipio',
    'tipoCliente',
    'regimenFiscal',
    'action',
  ];

  readonly pag = new Paginador<Cliente>(CONSTANTS.PAGINATION.PAGE_SIZE);

  /** Chip outline con color determinístico por tipo de cliente (regla 10). */
  private readonly tipoPalette = ['#5d87ff', '#fa896b', '#13deb9', '#ffae1f', '#539bff', '#2e7d32', '#7c4dff', '#e91e63', '#00838f', '#8d6e63'];

  private search = '';
  /** Orden server-side whitelisteado por la API: nombre | rfc | municipio. */
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
    this.blockUI.start(this.translate.instant('clientes.msg.loading'));
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
          console.error('Error al listar clientes', err);
          this.notify.notify('error', this.translate.instant('clientes.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('clientes.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar clientes', err);
          this.notify.notify('error', this.translate.instant('clientes.msg.loadError'));
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

  tipoColor(id: number): string {
    return this.tipoPalette[Math.abs(id) % this.tipoPalette.length];
  }

  agregar(): void {
    this.abrirFormulario({});
  }

  editar(cliente: Cliente): void {
    this.abrirFormulario({ cliente });
  }

  ver(cliente: Cliente): void {
    this.abrirFormulario({ cliente, readonly: true });
  }

  eliminar(cliente: Cliente): void {
    Swal.fire({
      title: this.translate.instant('clientes.confirm.deleteTitle'),
      text: this.translate.instant('clientes.confirm.deleteText', {
        nombre: cliente.nombreCompleto?.trim(),
      }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('clientes.confirm.accept'),
      cancelButtonText: this.translate.instant('clientes.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.blockUI.start();
      this.service
        .cambiarEstatus(cliente.idCliente, false)
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
              this.cargar();
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('clientes.msg.deleteFallback'),
              );
            }
          },
          error: (err) => {
            console.error('Error al eliminar cliente', err);
            this.notify.notify('error', this.translate.instant('clientes.msg.deleteError'));
          },
        });
    });
  }

  private abrirFormulario(data: ClienteFormData): void {
    const ref = this.dialog.open(ClienteFormDialogComponent, {
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
