import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
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
import { RelacionLiquido } from 'src/app/admin/models/relacion-liquidos/relacion-liquido';
import { RelacionLiquidosService } from 'src/app/admin/services/relacion-liquidos.service';
import {
  RelacionLiquidoFormData,
  RelacionLiquidoFormDialogComponent,
} from '../../components/relacion-liquido-form-dialog/relacion-liquido-form-dialog.component';

@Component({
  selector: 'app-relacion-liquidos-list',
  standalone: true,
  imports: [
    MaterialModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    PaginadorComponent,
    DecimalPipe,
  ],
  templateUrl: './relacion-liquidos-list.component.html',
  styles: [
    `.mat-mdc-cell.mat-table-sticky,
     .mat-mdc-header-cell.mat-table-sticky {
      background-color: var(--mat-sys-surface, #fff);
    }`,
  ],
})
export class RelacionLiquidosListComponent implements OnInit {
  private readonly service = inject(RelacionLiquidosService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('relacionLiquidos') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'id',
    'granel',
    'envasado',
    'envase',
    'unidad',
    'cantidad',
    'action',
  ];

  readonly pag = new Paginador<RelacionLiquido>(CONSTANTS.PAGINATION.PAGE_SIZE);

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
    this.blockUI.start(this.translate.instant('relacionLiquidos.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), q: this.search })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar relaciones de líquidos', err);
          this.notify.notify('error', this.translate.instant('relacionLiquidos.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('relacionLiquidos.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar relaciones de líquidos', err);
          this.notify.notify('error', this.translate.instant('relacionLiquidos.msg.loadError'));
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

  ver(relacion: RelacionLiquido): void {
    this.abrirFormulario({ relacion, readonly: true });
  }

  editar(relacion: RelacionLiquido): void {
    this.abrirFormulario({ relacion });
  }

  desactivar(relacion: RelacionLiquido): void {
    Swal.fire({
      title: this.translate.instant('relacionLiquidos.confirm.deleteTitle'),
      text: this.translate.instant('relacionLiquidos.confirm.deleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('relacionLiquidos.confirm.accept'),
      cancelButtonText: this.translate.instant('relacionLiquidos.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.blockUI.start(this.translate.instant('relacionLiquidos.msg.deleting'));
      this.service
        .desactivar(relacion.idRelacionEnvasadoAgranel)
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
              this.cargar();
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('relacionLiquidos.msg.deleteFallback'),
              );
            }
          },
          error: (err) => {
            console.error('Error al desactivar relación de líquidos', err);
            this.notify.notify('error', this.translate.instant('relacionLiquidos.msg.deleteError'));
          },
        });
    });
  }

  private abrirFormulario(data: RelacionLiquidoFormData): void {
    const ref = this.dialog.open(RelacionLiquidoFormDialogComponent, {
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
