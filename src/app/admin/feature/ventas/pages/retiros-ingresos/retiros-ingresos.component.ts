import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { EMPTY_LINKS } from 'src/app/admin/models/shared/paged-result';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { CajaInfo } from 'src/app/admin/models/ventas/caja-info';
import { Retiro } from 'src/app/admin/models/ventas/retiro';
import { TipoRetiroId } from 'src/app/admin/models/ventas/tipo-retiro';
import { ESTATUS_RETIRO } from 'src/app/admin/models/ventas/estatus-retiro';
import { RetiroRequestModel } from 'src/app/admin/models/ventas/retiro-request';
import { IngresoEfectivoRequestModel } from 'src/app/admin/models/ventas/ingreso-efectivo-request';
import { TipoIngresoEfectivoId } from 'src/app/admin/models/ventas/tipo-ingreso-efectivo';
import { ActualizarEstatusRetiroRequestModel } from 'src/app/admin/models/ventas/actualizar-estatus-retiro-request';
import { CajaService } from 'src/app/admin/services/caja.service';
import { ExcesoEfectivoBadgeComponent } from '../../components/exceso-efectivo-badge/exceso-efectivo-badge.component';

/**
 * Pantalla de Retiros / Ingresos de efectivo (FE-B4). Tres pestañas, réplica del legado:
 * - **Retiro por exceso**: `#ModalCierreExceso` de `Ventas.cshtml` + `retirarExcesoEfectivo()`
 *   de `EvtVentas.js` — valida en cliente que el monto no exceda lo disponible (tope real es
 *   server-side, esto es solo UX temprana).
 * - **Ingreso de efectivo**: `_IngresoEfectivo.cshtml` con `idTipoIngresoEfectivo = 2`
 *   ("Solicitud de efectivo").
 * - **Listado / autorización de retiros**: réplica de `_ObtenerRetirosAutorizacion.cshtml`
 *   (tipo, monto, usuario, estación, estatus, usuario que autorizó, acciones aprobar/rechazar).
 *   La visibilidad por rol (qué filas/acciones ve cada usuario) la aplica el backend real
 *   (API-B4); esta pantalla solo pinta lo que reciba — ver nota en `CajaService.obtenerRetiros`.
 *
 * Paginación LOCAL (regla 10): mientras no hay API real, `CajaService` devuelve la lista
 * completa mockeada; se pagina en memoria igual que `inventario-fisico` (precedente ya
 * aprobado). FE-B5 debe migrar a paginación server-side cuando el endpoint real pagine.
 *
 * ⚠️ Sin integración real (FE-B5): `CajaService` está simulado (ver su cabecera).
 */
@Component({
  selector: 'app-retiros-ingresos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    TranslatePipe,
    BlockUIModule,
    CurrencyPipe,
    DatePipe,
    PaginadorComponent,
    ExcesoEfectivoBadgeComponent,
  ],
  templateUrl: './retiros-ingresos.component.html',
  styleUrl: './retiros-ingresos.component.scss',
})
export class RetirosIngresosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cajaService = inject(CajaService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('retiros-ingresos') blockUI!: NgBlockUI;

  readonly ESTATUS_RETIRO = ESTATUS_RETIRO;
  readonly TipoRetiroId = TipoRetiroId;
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

  readonly cajaInfo = signal<CajaInfo | null>(null);
  readonly guardandoRetiro = signal(false);
  readonly guardandoIngreso = signal(false);
  readonly actualizandoRetiro = signal<number | null>(null);

  readonly disponibleParaRetirar = computed(() => {
    const info = this.cajaInfo();
    if (!info) return 0;
    return Math.max(0, info.efectivoDisponible - info.retirosHechosDia);
  });

  readonly retiroForm = this.fb.group({
    monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  readonly ingresoForm = this.fb.group({
    monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  // ====================== Listado (paginación local, regla 10) ======================

  private retirosCompletos: Retiro[] = [];
  readonly pag = new Paginador<Retiro>(CONSTANTS.PAGINATION.PAGE_SIZE);
  readonly searchControl = new FormControl('', { nonNullable: true });
  /** Monto editable por fila antes de autorizar (paridad con el input inline del legado). */
  private readonly montosAutorizar = new Map<number, number>();

  ngOnInit(): void {
    this.cargarInfo();
    this.cargarRetiros();
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => this.setLocalPage(1));
  }

  private cargarInfo(): void {
    this.cajaService.obtenerInfoCierre().subscribe({
      next: (res) => this.cajaInfo.set(res),
      error: (err) => console.error('Error al consultar el resumen de caja', err),
    });
  }

  private cargarRetiros(): void {
    this.blockUI.start(this.translate.instant('ventas.caja.retiro.msg.cargandoListado'));
    this.cajaService
      .obtenerRetiros()
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
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

  // ====================== Retiro por exceso de efectivo ======================

  registrarRetiro(): void {
    if (this.retiroForm.invalid || this.guardandoRetiro()) {
      this.retiroForm.markAllAsTouched();
      return;
    }

    const monto = Number(this.retiroForm.value.monto ?? 0);
    const disponible = this.disponibleParaRetirar();

    // Validación en cliente (UX temprana); el tope real lo valida el servidor (API-B4).
    if (monto > disponible) {
      this.notify.notify(
        'warning',
        this.translate.instant('ventas.caja.retiro.msg.excedeDisponible', {
          disponible: disponible.toFixed(2),
        }),
      );
      return;
    }

    this.guardandoRetiro.set(true);
    this.blockUI.start(this.translate.instant('ventas.caja.retiro.msg.guardando'));
    this.cajaService
      .registrarRetiro(new RetiroRequestModel({ monto }))
      .pipe(
        finalize(() => {
          this.guardandoRetiro.set(false);
          this.blockUI.stop();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify('success', res.mensaje ?? this.translate.instant('ventas.caja.retiro.msg.exito'));
            this.retiroForm.reset();
            this.cargarInfo();
            this.cargarRetiros();
          } else {
            this.notify.notify('error', res?.mensaje ?? this.translate.instant('ventas.caja.retiro.msg.error'));
          }
        },
        error: (err) => {
          console.error('Error al registrar el retiro por exceso de efectivo', err);
          this.notify.notify('error', this.translate.instant('ventas.caja.retiro.msg.error'));
        },
      });
  }

  // ====================== Ingreso de efectivo ======================

  registrarIngreso(): void {
    if (this.ingresoForm.invalid || this.guardandoIngreso()) {
      this.ingresoForm.markAllAsTouched();
      return;
    }

    const monto = Number(this.ingresoForm.value.monto ?? 0);
    const request = new IngresoEfectivoRequestModel({
      monto,
      idTipoIngresoEfectivo: TipoIngresoEfectivoId.SolicitudEfectivo,
    });

    this.guardandoIngreso.set(true);
    this.blockUI.start(this.translate.instant('ventas.caja.ingreso.msg.guardando'));
    this.cajaService
      .registrarIngreso(request)
      .pipe(
        finalize(() => {
          this.guardandoIngreso.set(false);
          this.blockUI.stop();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify('success', res.mensaje ?? this.translate.instant('ventas.caja.ingreso.msg.exito'));
            this.ingresoForm.reset();
            this.cargarInfo();
            this.cargarRetiros();
          } else {
            this.notify.notify('error', res?.mensaje ?? this.translate.instant('ventas.caja.ingreso.msg.error'));
          }
        },
        error: (err) => {
          console.error('Error al registrar el ingreso de efectivo', err);
          this.notify.notify('error', this.translate.instant('ventas.caja.ingreso.msg.error'));
        },
      });
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

  aprobar(retiro: Retiro): void {
    this.cambiarEstatusRetiro(retiro, ESTATUS_RETIRO.AUTORIZADO);
  }

  rechazar(retiro: Retiro): void {
    this.cambiarEstatusRetiro(retiro, ESTATUS_RETIRO.CANCELADO);
  }

  private cambiarEstatusRetiro(retiro: Retiro, idEstatus: number): void {
    if (this.actualizandoRetiro()) return;

    const montoAutorizado = idEstatus === ESTATUS_RETIRO.AUTORIZADO ? this.montoAutorizar(retiro) : null;
    const request = new ActualizarEstatusRetiroRequestModel({ idEstatus, montoAutorizado });

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

  // ====================== Búsqueda + paginación local ======================

  navegar(pagina: string): void {
    this.setLocalPage(parseInt(pagina, 10) || 1);
  }

  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.setLocalPage(1);
  }

  private filtrados(): Retiro[] {
    const term = this.searchControl.value.trim().toUpperCase();
    if (!term) return this.retirosCompletos;
    return this.retirosCompletos.filter(
      (r) => r.nombreUsuario.toUpperCase().includes(term) || r.nombreEstacion.toUpperCase().includes(term),
    );
  }

  /** Corta la página `pagina` de la lista en memoria y sintetiza links/meta del paginador. */
  private setLocalPage(pagina: number): void {
    const lista = this.filtrados();
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
