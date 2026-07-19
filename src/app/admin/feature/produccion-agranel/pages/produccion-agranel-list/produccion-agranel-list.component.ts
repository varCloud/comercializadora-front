import { DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { Sort } from '@angular/material/sort';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL } from 'src/app/models/result-modal';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Usuario } from 'src/app/admin/models/usuarios/usuario';
import {
  ESTATUS_AGRANEL_PENDIENTES,
  ProcesoProduccionAgranel,
} from 'src/app/admin/models/produccion-agranel/proceso-produccion-agranel';
import { ProduccionAgranelService } from 'src/app/admin/services/produccion-agranel.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';
import { ProduccionAgranelFormDialogComponent } from '../../components/produccion-agranel-form-dialog/produccion-agranel-form-dialog.component';
import { EnvasadoFormDialogComponent } from '../../components/envasado-form-dialog/envasado-form-dialog.component';
import {
  AprobarFormDialogComponent,
  AprobarFormData,
} from '../../components/aprobar-form-dialog/aprobar-form-dialog.component';

/**
 * Rol habilitado para el filtro de usuario (paridad con la pantalla ProduccionAgranel del
 * legado, que llenaba el combo con ObtenerUsuarios(idRol = 13) + opción TODOS). No hay
 * endpoint propio: se reusa UsuariosService (regla 00).
 */
const ROL_PRODUCCION_AGRANEL = 13;

/**
 * Pantalla "Producción a granel". Migra la vista ProduccionAgranel.cshtml del legado (listado
 * del proceso con filtros usuario/estatus/rango de fechas) y agrega las acciones operativas de
 * los webservices móviles migrados: "Agregar a producción" (MPL → granel), "Registrar
 * envasado" (granel → envasado) y "Aprobar" por renglón pendiente. Sin buscador de texto libre
 * (regla 13 no aplica: filtros estructurados, igual que Producción Líquidos).
 */
@Component({
  selector: 'app-produccion-agranel-list',
  standalone: true,
  imports: [
    MaterialModule,
    MatNativeDateModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    NgSelectModule,
    PaginadorComponent,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './produccion-agranel-list.component.html',
  styleUrl: './produccion-agranel-list.component.scss',
})
export class ProduccionAgranelListComponent implements OnInit {
  private readonly service = inject(ProduccionAgranelService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  @BlockUI('produccionAgranel') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'codigoBarras',
    'descripcionProducto',
    'descripcionLinea',
    'nombreUsuario',
    'cantidad',
    'cantidadAceptada',
    'cantidadRestante',
    'ultimoCostoCompra',
    'fechaAlta',
    'descripcionEstatus',
    'action',
  ];

  readonly pag = new Paginador<ProcesoProduccionAgranel>(CONSTANTS.PAGINATION.PAGE_SIZE);

  readonly estatus = signal<Catalogo[]>([]);
  readonly usuarios = signal<Usuario[]>([]);

  /** Chip outline con color determinístico por estatus (regla 10). */
  private readonly estatusPalette = ['#ffae1f', '#5d87ff', '#2e7d32', '#e53935', '#fa896b', '#8d6e63'];

  // Filtros (equivalentes al legado: usuario rol 13, estatus del proceso, rango de fechas).
  readonly idUsuario = new FormControl<number | null>(null);
  readonly idEstatus = new FormControl<number | null>(null);
  readonly hoy = new Date();
  // Rango de fechas con mat-date-range-input (regla 18): default = hoy/hoy, visible en el
  // input desde la carga inicial; `hoy` como `[max]` para que el propio día de hoy nunca
  // quede excluido del calendario.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  /** Orden server-side whitelisteado por la API: fecha | producto | cantidad | estatus. */
  private order: string | null = null;
  private sort: 'asc' | 'desc' | null = null;

  ngOnInit(): void {
    this.service.obtenerEstatus().subscribe({
      next: (estatus) => this.estatus.set(estatus),
      error: (err) => console.error('Error al cargar catálogo de estatus', err),
    });

    this.usuariosService.listar({ idRol: ROL_PRODUCCION_AGRANEL, perPage: 200 }).subscribe({
      next: (pagina) => this.usuarios.set(pagina.data),
      error: (err) => console.error('Error al cargar usuarios de producción', err),
    });

    this.cargar();
  }

  private get filtros(): Record<string, string | number | null> {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      idUsuario: this.idUsuario.value,
      idEstatus: this.idEstatus.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
      order: this.order,
      sort: this.sort,
    };
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('produccionAgranel.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), ...this.filtros })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar producción a granel', err);
          this.notify.notify('error', this.translate.instant('produccionAgranel.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('produccionAgranel.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar producción a granel', err);
          this.notify.notify('error', this.translate.instant('produccionAgranel.msg.loadError'));
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

  /** Color del chip de estatus (regla 10), determinístico por id de estatus. */
  estatusColor(idEstatus: number): string {
    return this.estatusPalette[Math.abs(idEstatus) % this.estatusPalette.length];
  }

  /** Solo los renglones pendientes (estatus 1/2) muestran la acción "Aprobar". */
  esPendiente(proceso: ProcesoProduccionAgranel): boolean {
    return ESTATUS_AGRANEL_PENDIENTES.includes(proceso.idEstatusProduccionAgranel);
  }

  /** Botón "Agregar a producción": alta de producto MPL al proceso (WS móvil migrado). */
  agregarProduccion(): void {
    const ref = this.dialog.open(ProduccionAgranelFormDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      disableClose: true,
    });
    ref.afterClosed().subscribe((res) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) this.cargar();
    });
  }

  /** Botón "Registrar envasado": convierte granel → producto envasado (WS móvil migrado). */
  registrarEnvasado(): void {
    const ref = this.dialog.open(EnvasadoFormDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      disableClose: true,
    });
    ref.afterClosed().subscribe((res) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) this.cargar();
    });
  }

  /** Acción por renglón pendiente: capturar cantidad atendida + observaciones y aprobar. */
  aprobar(proceso: ProcesoProduccionAgranel): void {
    const ref = this.dialog.open(AprobarFormDialogComponent, {
      data: { proceso } satisfies AprobarFormData,
      width: '600px',
      maxWidth: '95vw',
      disableClose: true,
    });
    ref.afterClosed().subscribe((res) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) this.cargar();
    });
  }

  /** Botón "Buscar": aplica los filtros del formulario. */
  buscar(): void {
    this.cargar();
  }

  /** Botón "Limpiar": resetea filtros (rango de fechas vuelve a su default hoy/hoy). */
  limpiarFiltros(): void {
    this.idUsuario.reset();
    this.idEstatus.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.cargar();
  }
}
