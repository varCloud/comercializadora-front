import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NgSelectModule } from '@ng-select/ng-select';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL } from 'src/app/models/result-modal';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { LimiteInventario } from 'src/app/admin/models/limites-inventario/limite-inventario';
import { GuardarLimiteRequestModel } from 'src/app/admin/models/limites-inventario/guardar-limite-request';
import { LimitesInventarioService } from 'src/app/admin/services/limites-inventario.service';
import { ImportarExcelDialogComponent } from '../../components/importar-excel-dialog/importar-excel-dialog.component';

@Component({
  selector: 'app-limites-inventario-list',
  standalone: true,
  imports: [
    FormsModule,
    NgSelectModule,
    MaterialModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    PaginadorComponent,
  ],
  templateUrl: './limites-inventario-list.component.html',
  styleUrl: './limites-inventario-list.component.scss',
})
export class LimitesInventarioListComponent implements OnInit {
  private readonly service = inject(LimitesInventarioService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('limites') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'almacen',
    'linea',
    'producto',
    'codigoBarras',
    'minimo',
    'maximo',
    'cantidadInventario',
    'cantidadSugerida',
    'estatus',
  ];

  readonly pag = new Paginador<LimiteInventario>(CONSTANTS.PAGINATION.PAGE_SIZE);

  // Catálogos de los filtros.
  readonly almacenes = signal<Catalogo[]>([]);
  readonly lineas = signal<Catalogo[]>([]);
  readonly estatus = signal<Catalogo[]>([]);

  // Estado de los filtros (0 = todos).
  idAlmacen = 0;
  idLinea = 0;
  idEstatus = 0;

  private search = '';
  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((value) => {
        this.search = value;
        this.cargar();
      });

    this.service.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID).subscribe((a) => this.almacenes.set(a));
    this.service.obtenerLineas().subscribe((l) => this.lineas.set(l));
    this.service.obtenerEstatus().subscribe((e) => this.estatus.set(e));

    this.cargar();
  }

  /** Primera consulta / recarga desde la página 1 (al buscar o cambiar filtros/tamaño). */
  cargar(): void {
    this.fetch(1);
  }

  /** Navegación por links (first/prev/next/last). */
  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('limitesInventario.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => this.errorListado(err),
      });
  }

  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.cargar();
  }

  applyFilter(value: string): void {
    this.search$.next(value);
  }

  /** Cambió un filtro (almacén/línea/estatus) → recargar desde la página 1. */
  onFiltroChange(): void {
    this.cargar();
  }

  private fetch(page: number): void {
    this.blockUI.start(this.translate.instant('limitesInventario.msg.loading'));
    this.service
      .listar({
        page,
        perPage: this.pag.perPage(),
        q: this.search,
        idAlmacen: this.idAlmacen,
        idLineaProducto: this.idLinea,
        idEstatusLimiteInv: this.idEstatus,
      })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => this.errorListado(err),
      });
  }

  private recargarActual(): void {
    this.fetch(this.pag.meta().currentPage || 1);
  }

  private errorListado(err: unknown): void {
    console.error('Error al listar límites de inventario', err);
    this.notify.notify('error', this.translate.instant('limitesInventario.msg.loadError'));
  }

  /** Color del chip de estatus: 1 verde, 2 ámbar, 3 rojo, otro gris. */
  estatusColor(idStatus: number | undefined): string {
    switch (idStatus) {
      case 1:
        return '#2e7d32';
      case 2:
        return '#ffae1f';
      case 3:
        return '#e53935';
      default:
        return '#9e9e9e';
    }
  }

  /**
   * Edición inline de mín/máx (al perder el foco). Valida no vacío, entero y mín ≤ máx;
   * confirma y persiste vía PATCH (como el legado). Si algo falla, restaura el valor anterior.
   */
  editar(row: LimiteInventario, campo: 'minimo' | 'maximo', input: HTMLInputElement): void {
    const original = campo === 'minimo' ? row.minimo : row.maximo;
    const texto = input.value.trim();

    if (texto === '') {
      this.notify.notify('error', this.translate.instant('limitesInventario.edit.empty'));
      input.value = String(original);
      return;
    }

    const nuevo = parseInt(texto, 10);
    if (!Number.isInteger(nuevo)) {
      this.notify.notify('error', this.translate.instant('limitesInventario.edit.notInteger'));
      input.value = String(original);
      return;
    }

    if (nuevo === original) return;

    const minimo = campo === 'minimo' ? nuevo : row.minimo;
    const maximo = campo === 'maximo' ? nuevo : row.maximo;
    if (minimo > maximo) {
      this.notify.notify('error', this.translate.instant('limitesInventario.edit.minGtMax'));
      input.value = String(original);
      return;
    }

    Swal.fire({
      title: '',
      text: this.translate.instant('limitesInventario.edit.confirm', {
        campo: this.translate.instant(`limitesInventario.columns.${campo}`),
      }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('limitesInventario.edit.accept'),
      cancelButtonText: this.translate.instant('limitesInventario.edit.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) {
        input.value = String(original);
        return;
      }

      this.blockUI.start(this.translate.instant('limitesInventario.msg.saving'));
      this.service
        .guardar(
          new GuardarLimiteRequestModel({
            idProducto: row.idProducto,
            idAlmacen: row.idAlmacen,
            minimo,
            maximo,
          }),
        )
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? this.translate.instant('limitesInventario.edit.ok'));
              this.recargarActual();
            } else {
              this.notify.notify('error', res?.mensaje ?? this.translate.instant('limitesInventario.edit.saveFallback'));
              input.value = String(original);
            }
          },
          error: (err) => {
            console.error('Error al actualizar límite', err);
            this.notify.notify('error', this.translate.instant('limitesInventario.edit.saveError'));
            input.value = String(original);
          },
        });
    });
  }

  /** Abre el diálogo de importación masiva; al guardar con éxito recarga el listado. */
  importar(): void {
    const ref = this.dialog.open(ImportarExcelDialogComponent, {
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

  /** Genera y descarga el formato .xlsx (encabezados que espera la importación). */
  descargarFormato(): void {
    const ws = XLSX.utils.aoa_to_sheet([['Codigo Barras', 'Almacen', 'Minimo', 'Maximo']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hoja1');
    XLSX.writeFile(wb, 'limites-inventario-formato.xlsx');
  }
}
