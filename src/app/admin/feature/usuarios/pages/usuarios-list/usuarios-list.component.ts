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
import { Usuario } from 'src/app/admin/models/usuarios/usuario';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';
import {
  UsuarioFormData,
  UsuarioFormDialogComponent,
} from '../../components/usuario-form-dialog/usuario-form-dialog.component';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, BlockUIModule, TranslatePipe, PaginadorComponent],
  templateUrl: './usuarios-list.component.html',
  styles: [
    `.rol-chip {
      display: inline-block;
      padding: 2px 10px;
      border: 1px solid;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      line-height: 18px;
    }`,
    `.mat-mdc-cell.mat-table-sticky,
     .mat-mdc-header-cell.mat-table-sticky {
      background-color: var(--mat-sys-surface, #fff);
    }`,
  ],
})
export class UsuariosListComponent implements OnInit {
  /** Paleta de colores para los chips de rol (distinta por rol, sin repetir adyacentes). */
  private readonly rolePalette = [
    '#5d87ff', '#fa896b', '#13deb9', '#ffae1f', '#539bff',
    '#2e7d32', '#7c4dff', '#e91e63', '#00838f', '#8d6e63',
  ];

  /** Color determinístico para un rol según su id (mismo rol → mismo color). */
  rolColor(idRol: number): string {
    return this.rolePalette[Math.abs(idRol) % this.rolePalette.length];
  }

  private readonly service = inject(UsuariosService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('usuarios') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'usuario',
    'nombreCompleto',
    'rol',
    'sucursal',
    'almacen',
    'telefono',
    'action',
  ];

  /** Estado de paginación (datos/links/meta) navegado por links de la API. */
  readonly pag = new Paginador<Usuario>(CONSTANTS.PAGINATION.PAGE_SIZE);

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
    this.blockUI.start('Cargando…');
    this.service
      .listar({ perPage: this.pag.perPage(), q: this.search })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar usuarios', err);
          this.notify.notify('error', this.translate.instant('usuarios.msg.loadError'));
        },
      });
  }

  /** Navegación por links (first/prev/next/last). */
  navegar(url: string): void {
    this.blockUI.start('Cargando…');
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar usuarios', err);
          this.notify.notify('error', this.translate.instant('usuarios.msg.loadError'));
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

  editar(usuario: Usuario): void {
    this.abrirFormulario({ usuario });
  }

  ver(usuario: Usuario): void {
    this.abrirFormulario({ usuario, readonly: true });
  }

  desactivar(usuario: Usuario): void {
    Swal.fire({
      title: this.translate.instant('usuarios.confirm.deactivateTitle'),
      text: this.translate.instant('usuarios.confirm.deactivateText', {
        nombre: usuario.nombreCompleto?.trim(),
      }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('usuarios.confirm.accept'),
      cancelButtonText: this.translate.instant('usuarios.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.blockUI.start();
      this.service
        .cambiarEstatus(usuario.idUsuario, false)
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
              this.cargar();
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('usuarios.msg.deactivateFallback'),
              );
            }
          },
          error: (err) => {
            console.error('Error al cambiar estatus', err);
            this.notify.notify('error', this.translate.instant('usuarios.msg.deactivateError'));
          },
        });
    });
  }

  private abrirFormulario(data: UsuarioFormData): void {
    const ref = this.dialog.open(UsuarioFormDialogComponent, {
      data,
      width: '800px',
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
