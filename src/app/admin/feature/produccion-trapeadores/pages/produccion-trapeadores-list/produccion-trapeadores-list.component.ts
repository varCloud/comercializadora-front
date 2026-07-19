import { DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { Sort } from '@angular/material/sort';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize, forkJoin } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Usuario } from 'src/app/admin/models/usuarios/usuario';
import { CargaMercanciaTrapeadores } from 'src/app/admin/models/produccion-trapeadores/carga-mercancia-trapeadores';
import { ProduccionTrapeadoresService } from 'src/app/admin/services/produccion-trapeadores.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';

/**
 * Roles habilitados para este reporte (paridad con `ConsultarProduccionProductos`/
 * `ConsultarUsuariosLiquidos` del legado, que para Trapeadores usaba el mismo filtro de roles
 * 12/13 que Líquidos — `ProductosController.cs` ~línea 675). No hay endpoint propio: se filtra
 * el catálogo general de roles de `UsuariosService` (regla 00 — reuso, no se crea catálogo nuevo).
 */
const ROLES_TRAPEADORES = [12, 13];

/**
 * Reporte de solo lectura "Producción Trapeadores" (carga de mercancía). Hermano de
 * ProduccionLiquidosListComponent: filtra por rol, usuario (en cascada por rol) y rango de
 * fechas; sin alta/edición/baja y sin buscador de texto libre (regla 13 no aplica: filtros
 * estructurados). Reusa UsuariosService para los catálogos de rol/usuario.
 */
@Component({
  selector: 'app-produccion-trapeadores-list',
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
  templateUrl: './produccion-trapeadores-list.component.html',
  styleUrl: './produccion-trapeadores-list.component.scss',
})
export class ProduccionTrapeadoresListComponent implements OnInit {
  private readonly service = inject(ProduccionTrapeadoresService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('produccionTrapeadores') blockUI!: NgBlockUI;

  readonly displayedColumns = [
    'idProducto',
    'descripcionUbicacion',
    'descripcionProducto',
    'cantidad',
    'nombreUsuario',
    'fechaAlta',
    'descripcionRol',
    'ultimoCostoCompra',
    'descTipoMovInventario',
  ];

  readonly pag = new Paginador<CargaMercanciaTrapeadores>(CONSTANTS.PAGINATION.PAGE_SIZE);

  readonly roles = signal<Catalogo[]>([]);
  readonly usuarios = signal<Usuario[]>([]);

  /** Chip outline con color determinístico por rol (regla 10). */
  private readonly rolPalette = ['#5d87ff', '#fa896b', '#13deb9', '#ffae1f', '#539bff', '#2e7d32', '#7c4dff', '#e91e63', '#00838f', '#8d6e63'];

  // Filtros del formulario (equivalentes al legado: rol, usuario en cascada, rango de fechas).
  readonly idRol = new FormControl<number | null>(null);
  readonly idUsuario = new FormControl<number | null>(null);
  readonly hoy = new Date();
  // Rango de fechas con mat-date-range-input (regla 18): default = hoy/hoy, visible en el
  // input desde la carga inicial; `hoy` como `[max]` para que el propio día de hoy nunca
  // quede excluido del calendario.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  /** Orden server-side whitelisteado por la API: fecha | cantidad | producto. */
  private order: string | null = null;
  private sort: 'asc' | 'desc' | null = null;

  ngOnInit(): void {
    this.usuariosService.obtenerRoles().subscribe({
      next: (roles) => this.roles.set(roles.filter((r) => ROLES_TRAPEADORES.includes(r.id))),
      error: (err) => console.error('Error al cargar catálogo de roles', err),
    });

    this.cargarUsuarios(null);
    this.cargar();
  }

  /** Cascada rol → usuario (paridad con ConsultarUsuariosLiquidos del legado). */
  onRolChange(): void {
    this.idUsuario.reset();
    this.cargarUsuarios(this.idRol.value);
  }

  /** Sin rol elegido ("TODOS"), trae los usuarios de ambos roles habilitados (12 y 13). */
  private cargarUsuarios(idRol: number | null): void {
    const roles = idRol ? [idRol] : ROLES_TRAPEADORES;
    forkJoin(roles.map((rol) => this.usuariosService.listar({ idRol: rol, perPage: 200 }))).subscribe({
      next: (paginas) => this.usuarios.set(paginas.flatMap((p) => p.data)),
      error: (err) => console.error('Error al cargar usuarios por rol', err),
    });
  }

  private get filtros(): Record<string, string | number | null> {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      idRol: this.idRol.value,
      idUsuario: this.idUsuario.value,
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
      order: this.order,
      sort: this.sort,
    };
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('produccionTrapeadores.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), ...this.filtros })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar producción de trapeadores', err);
          this.notify.notify('error', this.translate.instant('produccionTrapeadores.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('produccionTrapeadores.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar producción de trapeadores', err);
          this.notify.notify('error', this.translate.instant('produccionTrapeadores.msg.loadError'));
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

  /**
   * Color del chip de rol (regla 10). La entidad solo trae `descripcionRol` (texto, sin id),
   * así que el color se deriva de un hash simple del texto en vez del id de rol.
   */
  rolColor(descripcion: string | null): string {
    const texto = descripcion ?? '';
    let hash = 0;
    for (let i = 0; i < texto.length; i++) {
      hash = (hash * 31 + texto.charCodeAt(i)) | 0;
    }
    return this.rolPalette[Math.abs(hash) % this.rolPalette.length];
  }

  /** Botón "Buscar": aplica los filtros del formulario (rol/usuario/fechas). */
  buscar(): void {
    this.cargar();
  }

  /** Botón "Limpiar": resetea filtros (rango de fechas vuelve a su default hoy/hoy). */
  limpiarFiltros(): void {
    this.idRol.reset();
    this.idUsuario.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.cargarUsuarios(null);
    this.cargar();
  }
}
