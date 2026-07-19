import { CurrencyPipe, DatePipe, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Observable, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { FacturaPedidoEspecial } from 'src/app/admin/models/facturas/factura-pedido-especial';
import { EstatusFacturaId, ESTATUS_FACTURA_OPTIONS } from 'src/app/admin/models/facturas/estatus-factura';
import { AcuseEstatusCfdi } from 'src/app/admin/models/facturas/acuse-estatus-cfdi';
import { FacturasService } from 'src/app/admin/services/facturas.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';
import {
  ReenviarFacturaPeData,
  ReenviarFacturaPeDialogComponent,
} from '../../components/reenviar-factura-pe-dialog/reenviar-factura-pe-dialog.component';

/**
 * Pantalla "Facturas Pedidos Especiales": hermana independiente de "Facturas Ventas"
 * (`migracion_facturas_ventas`) — misma UX y acciones por estatus (Ver, Reenviar, Cancelar,
 * Consultar estatus), pero sobre `idPedidoEspecial` contra las rutas propias
 * `api/facturas/pedidos-especiales`. Migra `Views/FacturaPedidosEspeciales/*.cshtml` +
 * `js/EvtFacturasPedidosEspeciales.js` del legado. Se implementó como **pantalla independiente**
 * (decisión del usuario, ver HU): no se parametrizó el componente de ventas para servir ambas.
 * Sin buscador de texto libre (regla 13 no aplica: filtros estructurados, igual que ventas).
 */
@Component({
  selector: 'app-facturas-pe-list',
  standalone: true,
  imports: [
    MaterialModule,
    MatNativeDateModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    PaginadorComponent,
    SelectPaginadoComponent,
    DatePipe,
    CurrencyPipe,
  ],
  templateUrl: './facturas-pe-list.component.html',
  styleUrl: './facturas-pe-list.component.scss',
})
export class FacturasPeListComponent implements OnInit {
  private readonly service = inject(FacturasService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  @BlockUI('facturasPe') blockUI!: NgBlockUI;

  readonly EstatusFacturaId = EstatusFacturaId;
  readonly estatusOptions = ESTATUS_FACTURA_OPTIONS;

  readonly displayedColumns = [
    'idPedidoEspecial',
    'nombreCliente',
    'nombreUsuarioFacturacion',
    'codigoBarras',
    'montoTotal',
    'fechaTimbrado',
    'fechaCancelacion',
    'estatus',
    'action',
  ];

  readonly pag = new Paginador<FacturaPedidoEspecial>(CONSTANTS.PAGINATION.PAGE_SIZE);

  /** Chip outline con color determinístico por estatus (regla 10), mismo criterio que ventas. */
  private readonly estatusPalette: Record<number, string> = {
    [EstatusFacturaId.Facturada]: '#13deb9',
    [EstatusFacturaId.Cancelada]: '#5d87ff',
    [EstatusFacturaId.Error]: '#e53935',
    [EstatusFacturaId.PendienteDeCancelacion]: '#ffae1f',
  };

  // Filtros (equivalentes al legado: estatus, usuario, rango de fechas). Usuario es catálogo
  // grande → selector paginado (regla 16).
  readonly idStatusFactura = new FormControl<number | null>(null);
  readonly idUsuario = new FormControl<number | null>(null);
  readonly hoy = new Date();
  // Rango de fechas con mat-date-range-input (regla 18): default = hoy/hoy, visible desde la
  // carga inicial; `hoy` como `[max]` para que el propio día de hoy nunca quede excluido.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  // fetchPage para el selector paginado de usuarios (regla 16).
  readonly fetchUsuarios = (q: string, page: number): Observable<unknown[]> =>
    this.usuariosService.buscarPaginado(q, page);

  ngOnInit(): void {
    this.cargar();
  }

  private get filtros(): Record<string, string | number | null> {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      idStatusFactura: this.idStatusFactura.value,
      idUsuario: this.idUsuario.value,
      fechaInicio: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
    };
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('facturasPe.msg.loading'));
    this.service
      .listarPE({ perPage: this.pag.perPage(), ...this.filtros })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar facturas de pedidos especiales', err);
          this.notify.notify('error', this.translate.instant('facturasPe.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('facturasPe.msg.loading'));
    this.service
      .irLinkPE(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar facturas de pedidos especiales', err);
          this.notify.notify('error', this.translate.instant('facturasPe.msg.loadError'));
        },
      });
  }

  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.cargar();
  }

  /** Botón "Buscar": aplica los filtros del formulario. */
  buscar(): void {
    this.cargar();
  }

  /** Botón "Limpiar": resetea filtros (rango de fechas vuelve a su default hoy/hoy). */
  limpiarFiltros(): void {
    this.idStatusFactura.reset();
    this.idUsuario.reset();
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.cargar();
  }

  /** Color del chip de estatus (regla 10), determinístico por id de estatus. */
  estatusColor(idEstatusFactura: number): string {
    return this.estatusPalette[idEstatusFactura] ?? '#7b8893';
  }

  /** "Ver": abre el PDF timbrado en pestaña nueva (equivalente a `window.open` del legado). */
  ver(factura: FacturaPedidoEspecial): void {
    if (factura.pathArchivoFactura) {
      window.open(factura.pathArchivoFactura, '_blank');
    }
  }

  /** "Reenviar": diálogo con el detalle del pedido + correo de copia opcional. */
  reenviar(factura: FacturaPedidoEspecial): void {
    const ref = this.dialog.open(ReenviarFacturaPeDialogComponent, {
      data: {
        idPedidoEspecial: factura.idPedidoEspecial,
        montoTotal: factura.montoTotal,
      } satisfies ReenviarFacturaPeData,
      width: '700px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe();
  }

  /** "Cancelar": confirmación y cancelación ante el PAC; tras cancelar, consulta el estatus
   *  (mismo encadenado que CancelarFactura → ActualizarEstatusCancelacionFactura del legado). */
  cancelar(factura: FacturaPedidoEspecial): void {
    Swal.fire({
      title: this.translate.instant('facturasPe.confirm.cancelarTitle'),
      text: this.translate.instant('facturasPe.confirm.cancelarText', {
        idPedidoEspecial: factura.idPedidoEspecial,
      }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('facturasPe.confirm.accept'),
      cancelButtonText: this.translate.instant('facturasPe.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.blockUI.start(this.translate.instant('facturasPe.msg.cancelando'));
      this.service
        .cancelarPE({ idPedidoEspecial: factura.idPedidoEspecial })
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
              this.consultarEstatus(factura);
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('facturasPe.msg.cancelarFallback'),
              );
              this.cargar();
            }
          },
          error: (err) => {
            console.error('Error al cancelar factura de pedido especial', err);
            this.notify.notify('error', this.translate.instant('facturasPe.msg.cancelarError'));
          },
        });
    });
  }

  /** "Consultar estatus": consulta el acuse de cancelación ante el SAT (`esPedidoEspecial: true`,
   *  endpoint compartido con ventas) y muestra el resultado. Recarga el listado porque la API
   *  puede actualizar el estatus de la factura en la misma consulta. */
  consultarEstatus(factura: FacturaPedidoEspecial): void {
    this.blockUI.start(this.translate.instant('facturasPe.msg.consultando'));
    this.service
      .consultarEstatusCancelacion({ id: factura.idPedidoEspecial, esPedidoEspecial: true })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => {
          this.cargar();
          if (res?.estatus === 200 && res.modelo) {
            this.mostrarAcuse(factura.idPedidoEspecial, res.modelo);
          } else {
            this.notify.notify(
              'error',
              res?.mensaje ?? this.translate.instant('facturasPe.msg.consultaError'),
            );
          }
        },
        error: (err) => {
          console.error('Error al consultar estatus de cancelación PE', err);
          this.notify.notify('error', this.translate.instant('facturasPe.msg.consultaError'));
        },
      });
  }

  private mostrarAcuse(idPedidoEspecial: number, acuse: AcuseEstatusCfdi): void {
    Swal.fire({
      title: this.translate.instant('facturasPe.estatusCancelacion.title', { idPedidoEspecial }),
      html: [
        `<strong>${this.translate.instant('facturasPe.estatusCancelacion.estado')}:</strong> ${acuse.estado ?? '-'}`,
        `<strong>${this.translate.instant('facturasPe.estatusCancelacion.estatusCancelacion')}:</strong> ${acuse.estatusCancelacion ?? '-'}`,
        `<strong>${this.translate.instant('facturasPe.estatusCancelacion.validacionEfos')}:</strong> ${acuse.validacionEfos ?? '-'}`,
      ].join('<br>'),
      icon: 'info',
    });
  }
}
