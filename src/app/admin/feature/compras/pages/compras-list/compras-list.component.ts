import { DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Observable, Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL } from 'src/app/models/result-modal';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { Compra } from 'src/app/admin/models/compras/compra';
import { EstatusCompra } from 'src/app/admin/models/compras/estatus-compra';
import { ComprasService } from 'src/app/admin/services/compras.service';
import { ProveedoresService } from 'src/app/admin/services/proveedores.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';
import {
  CompraFormData,
  CompraFormDialogComponent,
} from '../../components/compra-form-dialog/compra-form-dialog.component';

@Component({
  selector: 'app-compras-list',
  standalone: true,
  imports: [
    MaterialModule,
    MatNativeDateModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    PaginadorComponent,
    SelectPaginadoComponent,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './compras-list.component.html',
  styles: [
    `.mat-mdc-cell.mat-table-sticky,
     .mat-mdc-header-cell.mat-table-sticky {
      background-color: var(--mat-sys-surface, #fff);
    }
    .rol-chip {
      display: inline-block;
      border: 1px solid;
      border-radius: 16px;
      padding: 2px 10px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
    .error-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #e53935;
      margin-left: 6px;
      vertical-align: middle;
    }
    
    `,
  ],
})
export class ComprasListComponent implements OnInit {
  private readonly service = inject(ComprasService);
  private readonly proveedoresService = inject(ProveedoresService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('compras') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'idCompra',
    'proveedor',
    'usuario',
    'fecha',
    'estatus',
    'solicitados',
    'recibidos',
    'devueltos',
    'total',
    'observaciones',
    'action',
  ];

  readonly pag = new Paginador<Compra>(CONSTANTS.PAGINATION.PAGE_SIZE);
  readonly estatusList = signal<EstatusCompra[]>([]);

  // Filtros del formulario de búsqueda (equivalentes al legado: proveedor, usuario, estatus, fecha).
  readonly idProveedor = new FormControl<number | null>(null);
  readonly idUsuario = new FormControl<number | null>(null);
  readonly idStatusCompra = new FormControl<number | null>(null);
  readonly hoy = new Date();
  // Rango de fechas con mat-date-range-input (regla 18): default = hoy/hoy, visible en el
  // input desde la carga inicial; `hoy` como `[max]` para que el propio día de hoy nunca
  // quede excluido del calendario.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  private search = '';
  private readonly search$ = new Subject<string>();

  // fetchPage para los selectores paginados (regla 16).
  readonly fetchProveedores = (q: string, page: number): Observable<unknown[]> =>
    this.proveedoresService.buscarPaginado(q, page);
  readonly fetchUsuarios = (q: string, page: number): Observable<unknown[]> =>
    this.usuariosService.buscarPaginado(q, page);

  ngOnInit(): void {
    this.service.obtenerEstatus().subscribe({
      next: (lista) => this.estatusList.set(lista),
      error: (err) => console.error('Error al cargar estatus de compra', err),
    });

    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((value) => {
        this.search = value;
        this.cargar();
      });

    this.cargar();
  }

  private get filtros(): Record<string, string | number | null> {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      q: this.search,
      idProveedor: this.idProveedor.value,
      idUsuario: this.idUsuario.value,
      idStatusCompra: this.idStatusCompra.value,
      fechaInicio: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
    };
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('compras.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), ...this.filtros })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar compras', err);
          this.notify.notify('error', this.translate.instant('compras.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('compras.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar compras', err);
          this.notify.notify('error', this.translate.instant('compras.msg.loadError'));
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

  /** Botón "Buscar": aplica los filtros del formulario. */
  buscar(): void {
    this.cargar();
  }

  /** Botón "Limpiar": resetea filtros (rango de fechas vuelve a su default hoy/hoy). */
  limpiarFiltros(): void {
    this.idProveedor.reset();
    this.idUsuario.reset();
    this.idStatusCompra.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.search = '';
    this.cargar();
  }

  agregar(): void {
    this.abrirFormulario({ idCompra: 0 });
  }

  editar(compra: Compra): void {
    this.abrirFormulario({ idCompra: compra.idCompra });
  }

  eliminar(compra: Compra): void {
    Swal.fire({
      title: this.translate.instant('compras.confirm.deleteTitle'),
      text: this.translate.instant('compras.confirm.deleteText', { id: compra.idCompra }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('compras.confirm.accept'),
      cancelButtonText: this.translate.instant('compras.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.blockUI.start(this.translate.instant('compras.msg.deleting'));
      this.service
        .eliminar(compra.idCompra)
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
              this.cargar();
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('compras.msg.deleteFallback'),
              );
            }
          },
          error: (err) => {
            console.error('Error al eliminar compra', err);
            this.notify.notify('error', this.translate.instant('compras.msg.deleteError'));
          },
        });
    });
  }

  /** Total a mostrar: monto recibido si la compra está Realizada(2)/Finalizada(3); si no, monto total. */
  totalCompra(c: Compra): number {
    return c.idStatus === 2 || c.idStatus === 3 ? c.montoTotalRecibido : c.montoTotal;
  }

  /** Color del chip de estatus, replicando la lógica de _ObtenerCompras.cshtml. */
  estatusColor(c: Compra): string {
    if (c.estadoCompra === 1 || c.estadoCompra === 2) {
      return c.idStatus === 2 ? '#13deb9' : '#539bff'; // realizada (verde) / finalizada (azul)
    }
    return c.idStatus === 4 ? '#ffae1f' : '#7b8893'; // cancelada (ámbar) / pendiente (gris)
  }

  /** Indica si la compra tiene productos con error (estadoCompra incorrecta). */
  tieneErrores(c: Compra): boolean {
    return c.estadoCompra === 2;
  }

  private abrirFormulario(data: CompraFormData): void {
    const ref = this.dialog.open(CompraFormDialogComponent, {
      data,
      width: '1100px',
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
