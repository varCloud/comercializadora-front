import { CurrencyPipe, DatePipe, formatDate } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Observable, Subject, debounceTime, distinctUntilChanged, finalize, map } from 'rxjs';
import Swal from 'sweetalert2';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL } from 'src/app/models/result-modal';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { Venta } from 'src/app/admin/models/ventas/venta';
import { EstatusVentaId } from 'src/app/admin/models/ventas/estatus-venta';
import { FormaPago } from 'src/app/admin/models/ventas/forma-pago';
import { VentasService } from 'src/app/admin/services/ventas.service';
import { abrirPdfBlob } from 'src/app/admin/shared/utils/abrir-pdf-blob';
import { ClientesService } from 'src/app/admin/services/clientes.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';
import { VentaDetalleDialogComponent } from '../../components/venta-detalle-dialog/venta-detalle-dialog.component';
import { AjustarIvaDialogComponent } from '../../components/ajustar-iva-dialog/ajustar-iva-dialog.component';
import { VentaDevolucionesComplementosDialogComponent } from '../../components/venta-devoluciones-complementos-dialog/venta-devoluciones-complementos-dialog.component';

/**
 * Pantalla de consulta/edición de ventas (FE-C3) y de ventas canceladas (FE-C4). Comparten el
 * mismo componente en vez de duplicar listado/filtros/tabla (regla 00 reuso): la ruta activa
 * decide el modo vía `data.soloCanceladas` (ver `ventas-routing.module.ts`) — en modo
 * canceladas se consume `GET /ventas/canceladas` en vez de `/listado` y se ocultan las
 * acciones "Cancelar"/"Ajustar IVA" (no aplican a una venta ya cancelada). El resto del
 * comportamiento (filtros, buscador, paginación server-side, ver detalle, ver devoluciones/
 * complementos) es idéntico en ambos modos.
 *
 * Filtros/paginación server-side (reglas 10/13/18), mismo patrón que Clientes y
 * "Reportes > Ventas": `idAlmacen`/`idRol` los resuelve el backend del JWT, nunca se mandan
 * desde aquí (regla de seguridad dura de la feature Ventas).
 */
@Component({
  selector: 'app-venta-listado',
  standalone: true,
  imports: [
    MaterialModule,
    MatNativeDateModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    SelectPaginadoComponent,
    PaginadorComponent,
    DatePipe,
    CurrencyPipe,
  ],
  templateUrl: './venta-listado.component.html',
  styleUrl: './venta-listado.component.scss',
})
export class VentaListadoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ventasService = inject(VentasService);
  private readonly clientesService = inject(ClientesService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('ventaListado') blockUI!: NgBlockUI;

  readonly EstatusVentaId = EstatusVentaId;

  /** `true` en la ruta `/ventas/canceladas` (ver nota de clase). */
  readonly soloCanceladas = this.route.snapshot.data['soloCanceladas'] === true;

  readonly displayedColumns = [
    'idVenta',
    'fechaAlta',
    'nombreCliente',
    'nombreUsuario',
    'descripcionFactFormaPago',
    'montoTotal',
    'estatusVenta',
    'action',
  ];

  readonly pag = new Paginador<Venta>(CONSTANTS.PAGINATION.PAGE_SIZE);
  readonly formasPago = signal<FormaPago[]>([]);
  readonly generandoTicket = signal(false);

  private search = '';
  private readonly search$ = new Subject<string>();

  readonly idCliente = new FormControl<number | null>(null);
  readonly idUsuario = new FormControl<number | null>(null);
  readonly idFactFormaPago = new FormControl<number | null>(null);
  readonly codigoBarrasTicket = new FormControl<string | null>(null);

  // Rango de fechas (regla 18): default hoy/hoy, visible desde la carga inicial.
  readonly hoy = new Date();
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  // fetchPage de los selectores paginados de cliente/usuario (regla 16), reusando los
  // servicios ya existentes de Clientes/Usuarios sin agregar métodos nuevos (regla 00).
  readonly fetchClientes = (q: string, page: number): Observable<unknown[]> =>
    this.clientesService.listar({ q, page, perPage: 25 }).pipe(map((res) => res.data));

  readonly fetchUsuarios = (q: string, page: number): Observable<unknown[]> =>
    this.usuariosService.buscarPaginado(q, page);

  ngOnInit(): void {
    this.ventasService.obtenerFormasPago().subscribe({
      next: (lista) => this.formasPago.set(lista),
      error: (err) => console.error('Error al cargar las formas de pago', err),
    });

    this.search$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((value) => {
      this.search = value;
      this.cargar();
    });

    this.cargar();
  }

  private get filtro() {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      idCliente: this.idCliente.value,
      idUsuario: this.idUsuario.value,
      idFactFormaPago: this.idFactFormaPago.value,
      codigoBarrasTicket: this.codigoBarrasTicket.value?.trim() || null,
      fechaInicio: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
    };
  }

  private mensajeError(): string {
    return this.soloCanceladas
      ? this.translate.instant('ventas.listado.msg.loadErrorCanceladas')
      : this.translate.instant('ventas.listado.msg.loadError');
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('ventas.listado.msg.loading'));
    const opts = { q: this.search, perPage: this.pag.perPage(), ...this.filtro };
    const listado$ = this.soloCanceladas
      ? this.ventasService.listarCanceladas(opts)
      : this.ventasService.listar(opts);

    listado$
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al consultar el listado de ventas', err);
          this.notify.notify('error', this.mensajeError());
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('ventas.listado.msg.loading'));
    this.ventasService
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar el listado de ventas', err);
          this.notify.notify('error', this.mensajeError());
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

  buscar(): void {
    this.cargar();
  }

  limpiarFiltros(): void {
    this.idCliente.reset();
    this.idUsuario.reset();
    this.idFactFormaPago.reset();
    this.codigoBarrasTicket.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.cargar();
  }

  /** Cancelar/ajustar IVA solo aplica a ventas activas, y nunca en el listado de canceladas. */
  puedeCancelar(venta: Venta): boolean {
    return !this.soloCanceladas && venta.estatusVenta === EstatusVentaId.Activa;
  }

  puedeAjustarIva(venta: Venta): boolean {
    return !this.soloCanceladas && venta.estatusVenta === EstatusVentaId.Activa;
  }

  /** "Reimprimir ticket" (FE-D1): tipo `venta` en el listado activo, `cancelada` en canceladas. */
  reimprimirTicket(venta: Venta): void {
    if (this.generandoTicket()) return;
    const tipo = this.soloCanceladas ? 'cancelada' : 'venta';

    this.generandoTicket.set(true);
    this.blockUI.start(this.translate.instant('ventas.listado.msg.generandoTicket'));
    this.ventasService
      .obtenerTicketPdf(venta.idVenta, tipo)
      .pipe(
        finalize(() => {
          this.generandoTicket.set(false);
          this.blockUI.stop();
        }),
      )
      .subscribe({
        next: (blob) => abrirPdfBlob(blob),
        error: (err) => {
          console.error('Error al generar el ticket PDF de la venta', err);
          this.notify.notify('error', this.translate.instant('ventas.listado.msg.errorTicket'));
        },
      });
  }

  ver(venta: Venta): void {
    this.dialog.open(VentaDetalleDialogComponent, {
      data: { idVenta: venta.idVenta },
      width: '900px',
      maxWidth: '95vw',
    });
  }

  verDevolucionesComplementos(venta: Venta): void {
    this.dialog.open(VentaDevolucionesComplementosDialogComponent, {
      data: { idVenta: venta.idVenta },
      width: '900px',
      maxWidth: '95vw',
    });
  }

  ajustarIva(venta: Venta): void {
    const ref = this.dialog.open(AjustarIvaDialogComponent, {
      data: { venta },
      width: '700px',
      maxWidth: '95vw',
    });

    ref.afterClosed().subscribe((res) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) {
        this.cargar();
      }
    });
  }

  cancelar(venta: Venta): void {
    Swal.fire({
      title: this.translate.instant('ventas.listado.confirm.cancelTitle'),
      text: this.translate.instant('ventas.listado.confirm.cancelText', { folio: venta.idVenta }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('ventas.listado.confirm.accept'),
      cancelButtonText: this.translate.instant('ventas.listado.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.blockUI.start(this.translate.instant('ventas.listado.msg.cancelando'));
      this.ventasService
        .cancelar(venta.idVenta)
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? this.translate.instant('ventas.listado.msg.cancelExito'));
              this.cargar();
            } else {
              this.notify.notify('error', res?.mensaje ?? this.translate.instant('ventas.listado.msg.cancelError'));
            }
          },
          error: (err) => {
            console.error('Error al cancelar la venta', err);
            this.notify.notify('error', this.translate.instant('ventas.listado.msg.cancelError'));
          },
        });
    });
  }
}
