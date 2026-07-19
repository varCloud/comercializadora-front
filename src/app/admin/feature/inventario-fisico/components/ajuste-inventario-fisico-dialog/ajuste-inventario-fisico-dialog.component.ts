import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgSelectModule } from '@ng-select/ng-select';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { EMPTY_LINKS } from 'src/app/admin/models/shared/paged-result';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { InventarioFisico } from 'src/app/admin/models/inventario-fisico/inventario-fisico';
import { AjusteInventarioFisico } from 'src/app/admin/models/inventario-fisico/ajuste-inventario-fisico';
import { ESTATUS_INVENTARIO_FISICO } from 'src/app/admin/models/inventario-fisico/estatus-inventario-fisico';
import { ActualizarEstatusInventarioFisicoRequestModel } from 'src/app/admin/models/inventario-fisico/actualizar-estatus-inventario-fisico-request';
import { InventarioFisicoService } from 'src/app/admin/services/inventario-fisico.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';
import { ProductosService } from 'src/app/admin/services/productos.service';

export interface AjusteInventarioFisicoDialogData {
  inventario: InventarioFisico;
}

/**
 * Diálogo XL "Ajuste Inventario Fisico". Migra el modal modalAjusteInventarioFisico del
 * legado (_InventarioFisico.cshtml + _ObtenerAjusteInventario.cshtml): filtros Almacén y
 * Línea de Producto (ambos con TODOS = 0) con búsqueda automática al abrir, tabla de 11
 * columnas con badge de Cant. Físico, Observaciones (editables solo con estatus 2) y
 * botones Cancelar Ajuste (→ 4) / Finalizar Ajuste (→ 3) con confirmación, visibles solo
 * con estatus 2. Al cambiar el estatus se cierra con OK y el listado se recarga (paridad
 * con el redirect del legado). La API devuelve la lista completa sin paginar (paridad);
 * el front pagina localmente reutilizando `Paginador` + `app-paginador` (regla 10, la
 * paginación en cliente es el último recurso permitido aquí).
 */
@Component({
  selector: 'app-ajuste-inventario-fisico-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgSelectModule,
    MaterialModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    PaginadorComponent,
    CurrencyPipe,
  ],
  templateUrl: './ajuste-inventario-fisico-dialog.component.html',
  styleUrl: './ajuste-inventario-fisico-dialog.component.scss',
})
export class AjusteInventarioFisicoDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(InventarioFisicoService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly productosService = inject(ProductosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<AjusteInventarioFisicoDialogComponent>);
  readonly data = inject<AjusteInventarioFisicoDialogData>(MAT_DIALOG_DATA);

  @BlockUI('ajusteInventarioFisico') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'idAjusteInventarioFisico',
    'producto',
    'linea',
    'almacen',
    'ubicacion',
    'cantActual',
    'cantFisico',
    'cantSobrante',
    'cantFaltante',
    'ultPrecioCompra',
    'errorProceso',
  ];

  readonly ESTATUS = ESTATUS_INVENTARIO_FISICO;

  /** Solo con estatus 2 (Iniciado) se editan las observaciones y se puede finalizar/cancelar. */
  readonly esEditable = this.data.inventario.estatus.idStatus === ESTATUS_INVENTARIO_FISICO.INICIADO;

  // Catálogos de los filtros (0 = TODOS, paridad con los "--TODOS--" del legado).
  readonly almacenes = signal<Catalogo[]>([]);
  readonly lineas = signal<Catalogo[]>([]);

  readonly filtrosAjusteForm = this.fb.group({
    idAlmacen: [0],
    idLineaProducto: [0],
  });

  readonly observacionesForm = this.fb.group({
    observaciones: [
      { value: this.data.inventario.observaciones ?? '', disabled: !this.esEditable },
      Validators.maxLength(500),
    ],
  });

  readonly saving = signal(false);

  /**
   * Paginación LOCAL (la API devuelve todos los ajustes): `ajustes` guarda la lista completa
   * de la última búsqueda y `pag` expone la página visible. Los links son números de página
   * serializados (no URLs) que `navegar` vuelve a resolver contra la lista en memoria.
   */
  private ajustes: AjusteInventarioFisico[] = [];
  readonly pag = new Paginador<AjusteInventarioFisico>(CONSTANTS.PAGINATION.PAGE_SIZE);

  ngOnInit(): void {
    this.usuariosService
      .obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID)
      .subscribe((a) => this.almacenes.set(a));
    this.productosService.obtenerLineas().subscribe((l) => this.lineas.set(l));

    // Búsqueda automática al abrir con TODOS/TODOS (paridad con el submit del legado).
    this.buscar();
  }

  /** Botón "Buscar" (y carga inicial): trae los ajustes con los filtros actuales. */
  buscar(): void {
    const { idAlmacen, idLineaProducto } = this.filtrosAjusteForm.value;
    this.blockUI.start(this.translate.instant('inventarioFisico.ajuste.msg.loading'));
    this.service
      .obtenerAjustes(this.data.inventario.idInventarioFisico, idAlmacen, idLineaProducto)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => {
          this.ajustes = res;
          this.setLocalPage(1);
        },
        error: (err) => {
          console.error('Error al consultar los ajustes del inventario físico', err);
          this.notify.notify(
            'error',
            this.translate.instant('inventarioFisico.ajuste.msg.loadError'),
          );
        },
      });
  }

  /** Navegación del `app-paginador`: el "link" local es el número de página. */
  navegar(pagina: string): void {
    this.setLocalPage(parseInt(pagina, 10) || 1);
  }

  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.setLocalPage(1);
  }

  /** Ubicación (paridad con Utils.mercanciaAcomodada): sin acomodar si piso/pasillo/rack = 0. */
  ubicacion(a: AjusteInventarioFisico): string {
    const p = a.producto;
    if (!p.idPiso && !p.idPasillo && !p.idRaq) {
      return this.translate.instant('inventarioFisico.ajuste.sinAcomodar');
    }
    return `(${p.piso}) (Pasillo:${p.pasillo}) (${p.raq})`;
  }

  /**
   * Badge de "Cant. Físico" (paridad con los badges del legado): sin ajustar → warning;
   * ajustado igual → success; menor → danger; mayor → info.
   */
  fisicoBadge(a: AjusteInventarioFisico): { texto: string; color: string } {
    if (!a.ajustado) {
      return {
        texto: this.translate.instant('inventarioFisico.ajuste.sinAjustar'),
        color: '#ffae1f',
      };
    }
    const texto = `${a.cantidadEnFisico} ${this.translate.instant('inventarioFisico.ajuste.ajustado')}`;
    if (a.cantidadEnFisico === a.cantidadActual) return { texto, color: '#13deb9' };
    if (a.cantidadEnFisico < a.cantidadActual) return { texto, color: '#e53935' };
    return { texto, color: '#539bff' };
  }

  /** Sobrante/Faltante derivados de cantidadAAjustar según el signo (paridad legado). */
  sobrante(a: AjusteInventarioFisico): number {
    return a.cantidadEnFisico > a.cantidadActual ? a.cantidadAAjustar : 0;
  }

  faltante(a: AjusteInventarioFisico): number {
    return a.cantidadEnFisico < a.cantidadActual ? a.cantidadAAjustar : 0;
  }

  /** "Finalizar Ajuste" (→ 3) o "Cancelar Ajuste" (→ 4), con confirmación (paridad legado). */
  cambiarEstatus(idEstatus: number): void {
    const confirmKey =
      idEstatus === this.ESTATUS.FINALIZADO
        ? 'inventarioFisico.ajuste.confirm.finalizarText'
        : 'inventarioFisico.ajuste.confirm.cancelarText';

    Swal.fire({
      title: '',
      text: this.translate.instant(confirmKey),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('inventarioFisico.confirm.accept'),
      cancelButtonText: this.translate.instant('inventarioFisico.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;

      const request = new ActualizarEstatusInventarioFisicoRequestModel({
        idEstatus,
        // Control deshabilitado con estatus ≠ 2: aquí siempre es editable, pero se lee con
        // getRawValue por consistencia (regla 17).
        observaciones: (this.observacionesForm.getRawValue().observaciones ?? '').trim() || null,
      });

      this.saving.set(true);
      this.blockUI.start(this.translate.instant('inventarioFisico.msg.updating'));
      this.service
        .actualizarEstatus(this.data.inventario.idInventarioFisico, request)
        .pipe(
          finalize(() => {
            this.saving.set(false);
            this.blockUI.stop();
          }),
        )
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
              this.dialogRef.close(
                new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, message: res.mensaje }),
              );
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('inventarioFisico.msg.saveFallback'),
              );
            }
          },
          error: (err) => {
            console.error('Error al actualizar el estatus del inventario físico', err);
            this.notify.notify('error', this.translate.instant('inventarioFisico.msg.saveError'));
          },
        });
    });
  }

  cerrar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }

  /** Corta la página `pagina` de la lista en memoria y sintetiza links/meta del paginador. */
  private setLocalPage(pagina: number): void {
    const perPage = this.pag.perPage();
    const total = this.ajustes.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(1, pagina), lastPage);
    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);

    this.pag.setPage({
      data: this.ajustes.slice(from - 1, to),
      links: {
        ...EMPTY_LINKS,
        first: page > 1 ? '1' : null,
        prev: page > 1 ? String(page - 1) : null,
        next: page < lastPage ? String(page + 1) : null,
        last: page < lastPage ? String(lastPage) : null,
      },
      meta: { currentPage: page, from, lastPage, path: '', perPage, to, total },
    });
  }
}
