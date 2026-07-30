import { CurrencyPipe, DatePipe, formatDate } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Observable, finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { SesionService } from 'src/app/services/sesion.service';
import { EMPTY_LINKS } from 'src/app/admin/models/shared/paged-result';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { Retiro } from 'src/app/admin/models/ventas/retiro';
import { TipoRetiroId } from 'src/app/admin/models/ventas/tipo-retiro';
import { ESTATUS_RETIRO } from 'src/app/admin/models/ventas/estatus-retiro';
import { RetirosFiltro } from 'src/app/admin/models/ventas/retiros-filtro';
import { ActualizarEstatusRetiroRequestModel } from 'src/app/admin/models/ventas/actualizar-estatus-retiro-request';
import { CajaService } from 'src/app/admin/services/caja.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';

/**
 * Pantalla "Retiros" (réplica de `Views/Ventas/Retiros.cshtml` +
 * `_ObtenerRetirosAutorizacion.cshtml`): SOLO un listado con filtros estructurados (Tipo Retiro,
 * Almacén, Usuario, Fecha) + Buscar/Limpiar y la tabla de autorización. El legado NO tiene tabs
 * ni resumen de caja ni formularios de retiro/ingreso en esta vista — esos son modales aparte
 * dentro del POS (`RetiroExcesoDialogComponent`/`IngresoEfectivoDialogComponent`).
 *
 * **Elección de endpoint + guarda de rol:** `CajaController` expone DOS listados — `/retiros`
 * (filtrado por rol: cada usuario ve solo lo propio, salvo Admin/Encargado que ven todo dentro
 * de su estación) y `/retiros/autorizacion` (sin filtro, ve todo). Si el usuario en sesión
 * (`SesionService`, `idRol`) es Admin o Encargado de almacén (`CONSTANTS.ROLES`), se usa
 * `/retiros/autorizacion` (necesita ver las solicitudes de todos para poder aprobarlas/
 * rechazarlas) y se muestran los controles de aprobar/rechazar; cualquier otro rol usa
 * `/retiros` (ya acotado por el backend a lo propio) y solo ve el estatus.
 *
 * **Paginación LOCAL (regla 10, último recurso):** el endpoint real
 * (`GET /api/caja/retiros[/autorizacion]`) regresa `Notificacion<IEnumerable<Retiro>>` SIN
 * `links`/`meta` (no pagina). Se mantiene la paginación en memoria (mismo patrón que
 * `cierre-list`/`inventario-fisico`); el footer `app-paginador` se conserva (obligatorio aun en
 * modo local).
 */
@Component({
  selector: 'app-retiros-ingresos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    MatNativeDateModule,
    TablerIconsModule,
    TranslatePipe,
    BlockUIModule,
    CurrencyPipe,
    DatePipe,
    PaginadorComponent,
    SelectPaginadoComponent,
  ],
  templateUrl: './retiros-ingresos.component.html',
  styleUrl: './retiros-ingresos.component.scss',
})
export class RetirosIngresosComponent implements OnInit {
  private readonly cajaService = inject(CajaService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly sesion = inject(SesionService);

  @BlockUI('retirosIngresos') blockUI!: NgBlockUI;

  readonly ESTATUS_RETIRO = ESTATUS_RETIRO;
  readonly TipoRetiroId = TipoRetiroId;

  /** Admin/Encargado de almacén: ven y autorizan retiros de todos (ver nota de clase). */
  readonly esAutorizador = computed(() => {
    const idRol = this.sesion.sesion()?.idRol ?? 0;
    return idRol === CONSTANTS.ROLES.ADMIN || idRol === CONSTANTS.ROLES.ENCARGADO_ALMACEN;
  });

  readonly displayedColumns = [
    'tipo',
    'monto',
    'usuario',
    'estacion',
    'estatus',
    'fecha',
    'usuarioAutorizo',
    'acciones',
  ];

  readonly actualizandoRetiro = signal<number | null>(null);

  // ====================== Filtros (réplica de Retiros.cshtml) ======================

  readonly almacenes = signal<Catalogo[]>([]);
  readonly idTipoRetiro = new FormControl<number | null>(null);
  readonly idAlmacen = new FormControl<number | null>(null);
  readonly idUsuario = new FormControl<number | null>(null);
  readonly fecha = new FormControl<Date | null>(null);

  readonly fetchUsuarios = (q: string, page: number): Observable<unknown[]> =>
    this.usuariosService.buscarPaginado(q, page);

  // ====================== Listado (paginación local, regla 10) ======================

  private retirosCompletos: Retiro[] = [];
  readonly pag = new Paginador<Retiro>(CONSTANTS.PAGINATION.PAGE_SIZE);
  /** Monto editable por fila antes de autorizar (paridad con el input inline del legado). */
  private readonly montosAutorizar = new Map<number, number>();

  ngOnInit(): void {
    this.usuariosService.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID).subscribe({
      next: (a) => this.almacenes.set(a),
      error: (err) => console.error('Error al cargar catálogo de almacenes', err),
    });

    this.cargarRetiros();
  }

  private get filtro(): RetirosFiltro {
    const fecha = this.fecha.value;
    return {
      idTipoRetiro: this.idTipoRetiro.value,
      idAlmacen: this.idAlmacen.value,
      idUsuario: this.idUsuario.value,
      fecha: fecha ? formatDate(fecha, 'yyyy-MM-dd', 'en-US') : null,
    };
  }

  private cargarRetiros(): void {
    this.blockUI.start(this.translate.instant('ventas.caja.retiro.msg.cargandoListado'));
    const listado$ = this.esAutorizador()
      ? this.cajaService.obtenerRetirosAutorizacion(this.filtro)
      : this.cajaService.obtenerRetiros(this.filtro);
    listado$.pipe(finalize(() => this.blockUI.stop())).subscribe({
      next: (res) => {
        this.retirosCompletos = res;
        this.setLocalPage(1);
      },
      error: (err) => {
        console.error('Error al consultar el listado de retiros', err);
        this.notify.notify('error', this.translate.instant('ventas.caja.retiro.msg.errorListado'));
      },
    });
  }

  /** Botón "Buscar": aplica los filtros del formulario. */
  buscar(): void {
    this.cargarRetiros();
  }

  /** Botón "Limpiar": todos los filtros vuelven a "Todos" y se vuelve a consultar. */
  limpiarFiltros(): void {
    this.idTipoRetiro.reset(null);
    this.idAlmacen.reset(null);
    this.idUsuario.reset(null);
    this.fecha.reset(null);
    this.cargarRetiros();
  }

  // ====================== Aprobación / rechazo de retiros ======================

  montoAutorizar(retiro: Retiro): number {
    return this.montosAutorizar.get(retiro.idRetiro) ?? retiro.montoRetiro;
  }

  onMontoAutorizarChange(retiro: Retiro, value: string): void {
    this.montosAutorizar.set(retiro.idRetiro, Number(value) || 0);
  }

  esPendiente(retiro: Retiro): boolean {
    return retiro.estatusRetiro.idStatus === ESTATUS_RETIRO.PENDIENTE;
  }

  /** Solo Admin/Encargado (ver `esAutorizador`) puede aprobar/rechazar un retiro pendiente. */
  puedeAutorizar(retiro: Retiro): boolean {
    return this.esPendiente(retiro) && this.esAutorizador();
  }

  aprobar(retiro: Retiro): void {
    this.cambiarEstatusRetiro(retiro, ESTATUS_RETIRO.AUTORIZADO);
  }

  rechazar(retiro: Retiro): void {
    this.cambiarEstatusRetiro(retiro, ESTATUS_RETIRO.CANCELADO);
  }

  private cambiarEstatusRetiro(retiro: Retiro, idStatus: number): void {
    if (this.actualizandoRetiro()) return;

    // Al rechazar se manda monto 0 (réplica de ActualizarEstatusRetiro() en EvtRetiros.js legado).
    const monto = idStatus === ESTATUS_RETIRO.AUTORIZADO ? this.montoAutorizar(retiro) : 0;
    const request = new ActualizarEstatusRetiroRequestModel({
      idStatus,
      monto,
      idTipoRetiro: retiro.tipoRetiro,
    });

    this.actualizandoRetiro.set(retiro.idRetiro);
    this.cajaService
      .actualizarEstatusRetiro(retiro.idRetiro, request)
      .pipe(finalize(() => this.actualizandoRetiro.set(null)))
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify('success', res.mensaje ?? '');
            this.cargarRetiros();
          } else {
            this.notify.notify('error', res?.mensaje ?? this.translate.instant('ventas.caja.retiro.msg.errorEstatus'));
          }
        },
        error: (err) => {
          console.error('Error al actualizar el estatus del retiro', err);
          this.notify.notify('error', this.translate.instant('ventas.caja.retiro.msg.errorEstatus'));
        },
      });
  }

  // ====================== Badges ======================

  tipoRetiroBadge(retiro: Retiro): { texto: string; color: string } {
    return retiro.tipoRetiro === TipoRetiroId.CierreDia
      ? { texto: this.translate.instant('ventas.caja.retiro.tipo.cierre'), color: '#13deb9' }
      : { texto: this.translate.instant('ventas.caja.retiro.tipo.exceso'), color: '#5d87ff' };
  }

  estatusBadge(retiro: Retiro): { texto: string; color: string } {
    switch (retiro.estatusRetiro.idStatus) {
      case ESTATUS_RETIRO.AUTORIZADO:
        return { texto: this.translate.instant('ventas.caja.retiro.estatus.autorizado'), color: '#13deb9' };
      case ESTATUS_RETIRO.CANCELADO:
        return { texto: this.translate.instant('ventas.caja.retiro.estatus.cancelado'), color: '#e53935' };
      default:
        return { texto: this.translate.instant('ventas.caja.retiro.estatus.pendiente'), color: '#ffae1f' };
    }
  }

  // ====================== Paginación local ======================

  navegar(pagina: string): void {
    this.setLocalPage(parseInt(pagina, 10) || 1);
  }

  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.setLocalPage(1);
  }

  /** Corta la página `pagina` de la lista en memoria y sintetiza links/meta del paginador. */
  private setLocalPage(pagina: number): void {
    const lista = this.retirosCompletos;
    const perPage = this.pag.perPage();
    const total = lista.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(1, pagina), lastPage);
    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);

    this.pag.setPage({
      data: lista.slice(from - 1, to),
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
