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
import { Estacion } from 'src/app/admin/models/estaciones/estacion';
import { EstacionesService } from 'src/app/admin/services/estaciones.service';
import {
  EstacionFormData,
  EstacionFormDialogComponent,
} from '../../components/estacion-form-dialog/estacion-form-dialog.component';

@Component({
  selector: 'app-estaciones-list',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, BlockUIModule, TranslatePipe, PaginadorComponent],
  templateUrl: './estaciones-list.component.html',
  styles: [
    `.mat-mdc-cell.mat-table-sticky,
     .mat-mdc-header-cell.mat-table-sticky {
      background-color: var(--mat-sys-surface, #fff);
    }`,
  ],
})
export class EstacionesListComponent implements OnInit {
  private readonly service = inject(EstacionesService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('estaciones') blockUI!: NgBlockUI;

  readonly displayedColumns = ['nombre', 'numero', 'almacen', 'configurado', 'action'];

  /** Estado de paginación (datos/links/meta) navegado por links de la API. */
  readonly pag = new Paginador<Estacion>(CONSTANTS.PAGINATION.PAGE_SIZE);

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

  /** Primera consulta / recarga desde la página 1 (al buscar o cambiar tamaño). */
  cargar(): void {
    this.blockUI.start(this.translate.instant('estaciones.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), q: this.search })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar estaciones', err);
          this.notify.notify('error', this.translate.instant('estaciones.msg.loadError'));
        },
      });
  }

  /** Navegación por links (first/prev/next/last) — no recompone el número de página. */
  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('estaciones.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar estaciones', err);
          this.notify.notify('error', this.translate.instant('estaciones.msg.loadError'));
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

  editar(estacion: Estacion): void {
    this.abrirFormulario({ estacion });
  }

  ver(estacion: Estacion): void {
    this.abrirFormulario({ estacion, readonly: true });
  }

  eliminar(estacion: Estacion): void {
    Swal.fire({
      title: this.translate.instant('estaciones.confirm.deleteTitle'),
      text: this.translate.instant('estaciones.confirm.deleteText', {
        nombre: estacion.nombre?.trim(),
      }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('estaciones.confirm.accept'),
      cancelButtonText: this.translate.instant('estaciones.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.blockUI.start();
      this.service
        .cambiarEstatus(estacion.idEstacion, false)
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
              this.cargar();
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('estaciones.msg.deleteFallback'),
              );
            }
          },
          error: (err) => {
            console.error('Error al eliminar estación', err);
            this.notify.notify('error', this.translate.instant('estaciones.msg.deleteError'));
          },
        });
    });
  }

  private abrirFormulario(data: EstacionFormData): void {
    const ref = this.dialog.open(EstacionFormDialogComponent, {
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
