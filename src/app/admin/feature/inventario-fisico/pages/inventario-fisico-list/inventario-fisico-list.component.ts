import { DatePipe, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { Sort } from '@angular/material/sort';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL } from 'src/app/models/result-modal';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import {
  InventarioFisico,
  TIPOS_INVENTARIO_FISICO,
  TIPO_INVENTARIO_GENERAL,
} from 'src/app/admin/models/inventario-fisico/inventario-fisico';
import { ESTATUS_INVENTARIO_FISICO } from 'src/app/admin/models/inventario-fisico/estatus-inventario-fisico';
import { InventarioFisicoService } from 'src/app/admin/services/inventario-fisico.service';
import { InventarioFisicoFormDialogComponent } from '../../components/inventario-fisico-form-dialog/inventario-fisico-form-dialog.component';
import {
  AjusteInventarioFisicoDialogComponent,
  AjusteInventarioFisicoDialogData,
} from '../../components/ajuste-inventario-fisico-dialog/ajuste-inventario-fisico-dialog.component';

/**
 * Pantalla "Inventario Físico". Migra InventarioFisico.cshtml + _ObtenerInventarioFisico.cshtml
 * y TODOS los eventos de evtInventarioFisico.js del legado: filtros tipo inventario (General
 * default, sin TODOS) + rango de fechas (default hoy/hoy), nombre editable inline con confirmación
 * al perder foco, badges de estatus, acciones Iniciar (estatus 1 → 2 con confirmación) y Ver
 * (estatus ≥ 2 → diálogo de ajuste), y alta con diálogo "Crear Inventario Físico". Sin buscador
 * de texto libre (regla 13 no aplica: filtros estructurados, igual que Producción a granel).
 */
@Component({
  selector: 'app-inventario-fisico-list',
  standalone: true,
  imports: [
    MaterialModule,
    MatNativeDateModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    PaginadorComponent,
    DatePipe,
  ],
  templateUrl: './inventario-fisico-list.component.html',
  styleUrl: './inventario-fisico-list.component.scss',
})
export class InventarioFisicoListComponent implements OnInit {
  private readonly service = inject(InventarioFisicoService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  @BlockUI('inventarioFisico') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'idInventarioFisico',
    'nombre',
    'fechaAlta',
    'fechaInicio',
    'fechaFin',
    'sucursal',
    'estatus',
    'tipoInventario',
    'observaciones',
    'action',
  ];

  readonly pag = new Paginador<InventarioFisico>(CONSTANTS.PAGINATION.PAGE_SIZE);

  /** Tipo Inventario: constante local (General/Individual), SIN opción TODOS (réplica fiel). */
  readonly tiposInventario = TIPOS_INVENTARIO_FISICO;
  readonly ESTATUS = ESTATUS_INVENTARIO_FISICO;

  /** Chip outline por estatus (regla 10): 1 neutro, 2 success, 3 warning, 4 danger (paridad badges legado). */
  private readonly estatusColores: Record<number, string> = {
    [ESTATUS_INVENTARIO_FISICO.PENDIENTE]: '#7b8893',
    [ESTATUS_INVENTARIO_FISICO.INICIADO]: '#13deb9',
    [ESTATUS_INVENTARIO_FISICO.FINALIZADO]: '#ffae1f',
    [ESTATUS_INVENTARIO_FISICO.CANCELADO]: '#e53935',
  };

  // Filtros (equivalentes al legado: tipo inventario default General + rango de fechas = hoy).
  readonly idTipoInventario = new FormControl<number>(TIPO_INVENTARIO_GENERAL, {
    nonNullable: true,
  });
  readonly hoy = new Date();
  // Rango de fechas con mat-date-range-input (regla 18): default = hoy/hoy, visible en el
  // input desde la carga inicial (no arranca vacío); `hoy` como `[max]` para que el propio
  // día de hoy nunca quede excluido del calendario.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  /** Orden server-side whitelisteado por la API: fecha | nombre | estatus. */
  private order: string | null = null;
  private sort: 'asc' | 'desc' | null = null;

  ngOnInit(): void {
    // Carga inicial automática con Tipo Inventario = General (paridad con el legado).
    this.cargar();
  }

  private get filtros(): Record<string, string | number | null> {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      idTipoInventario: this.idTipoInventario.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
      order: this.order,
      sort: this.sort,
    };
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('inventarioFisico.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), ...this.filtros })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar inventarios físicos', err);
          this.notify.notify('error', this.translate.instant('inventarioFisico.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('inventarioFisico.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar inventarios físicos', err);
          this.notify.notify('error', this.translate.instant('inventarioFisico.msg.loadError'));
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

  /** Botón "Buscar": aplica los filtros del formulario. */
  buscar(): void {
    this.cargar();
  }

  /** Botón "Limpiar": restaura los defaults (tipo inventario General, fechas = hoy). */
  limpiarFiltros(): void {
    this.idTipoInventario.setValue(TIPO_INVENTARIO_GENERAL);
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.cargar();
  }

  /** Color del chip de estatus (paridad con los badges del legado). */
  estatusColor(idStatus: number): string {
    return this.estatusColores[idStatus] ?? this.estatusColores[this.ESTATUS.PENDIENTE];
  }

  /** Botón "+": diálogo "Crear Inventario Físico" (nombre obligatorio). */
  crear(): void {
    const ref = this.dialog.open(InventarioFisicoFormDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true,
    });
    ref.afterClosed().subscribe((res) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) this.cargar();
    });
  }

  /**
   * Edición inline del nombre (blur del input, paridad con actualizarInventarioFisico del
   * legado): sin cambio → nada; vacío → toast de error y refocus; con cambio → confirmación
   * y PUT. Al cancelar la confirmación se restaura el valor original en el input.
   */
  renombrar(inv: InventarioFisico, input: HTMLInputElement): void {
    const original = (inv.nombre ?? '').trim();
    const nuevo = input.value.trim();

    if (nuevo === original) {
      return;
    }

    if (!nuevo) {
      this.notify.notify('error', this.translate.instant('inventarioFisico.msg.nombreVacio'));
      input.focus();
      return;
    }

    Swal.fire({
      title: '',
      text: this.translate.instant('inventarioFisico.confirm.renameText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('inventarioFisico.confirm.accept'),
      cancelButtonText: this.translate.instant('inventarioFisico.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) {
        input.value = inv.nombre ?? '';
        return;
      }
      this.blockUI.start(this.translate.instant('inventarioFisico.msg.updating'));
      this.service
        .renombrar(inv.idInventarioFisico, { nombre: nuevo })
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('inventarioFisico.msg.saveFallback'),
              );
            }
            // Paridad con el legado (PintarTabla tras responder, con o sin éxito).
            this.cargar();
          },
          error: (err) => {
            console.error('Error al renombrar el inventario físico', err);
            this.notify.notify('error', this.translate.instant('inventarioFisico.msg.saveError'));
          },
        });
    });
  }

  /** Acción "Iniciar" (solo estatus 1): confirmación → PATCH estatus 2 → recarga. */
  iniciar(inv: InventarioFisico): void {
    Swal.fire({
      title: '',
      text: this.translate.instant('inventarioFisico.confirm.iniciarText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('inventarioFisico.confirm.accept'),
      cancelButtonText: this.translate.instant('inventarioFisico.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.blockUI.start(this.translate.instant('inventarioFisico.msg.updating'));
      this.service
        .actualizarEstatus(inv.idInventarioFisico, { idEstatus: this.ESTATUS.INICIADO })
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
              this.cargar();
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('inventarioFisico.msg.saveFallback'),
              );
            }
          },
          error: (err) => {
            console.error('Error al iniciar el ajuste de inventario físico', err);
            this.notify.notify('error', this.translate.instant('inventarioFisico.msg.saveError'));
          },
        });
    });
  }

  /** Acción "Ver" (estatus ≥ 2): diálogo XL "Ajuste Inventario Fisico". */
  ver(inv: InventarioFisico): void {
    const ref = this.dialog.open(AjusteInventarioFisicoDialogComponent, {
      data: { inventario: inv } satisfies AjusteInventarioFisicoDialogData,
      width: '1200px',
      maxWidth: '95vw',
      disableClose: true,
    });
    ref.afterClosed().subscribe((res) => {
      // Paridad con el redirect del legado: al cambiar el estatus se recarga el listado.
      if (res?.status === ENUM_ESTATUS_MODAL.OK) this.cargar();
    });
  }
}
