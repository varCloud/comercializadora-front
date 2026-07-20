import { CurrencyPipe, DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Observable, finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { DevolucionItem } from 'src/app/admin/models/reportes-devolucion/devolucion-item';
import {
  TIPO_TICKET_OPTIONS,
  TipoTicketId,
} from 'src/app/admin/models/reportes-devolucion/tipo-ticket';
import { ReportesDevolucionService } from 'src/app/admin/services/reportes-devolucion.service';
import { UsuariosService } from 'src/app/admin/services/usuarios.service';

/**
 * Pantalla "Reportes > Devoluciones". Migra `ReportesController.Devoluciones/
 * ObtenerDevolucionesyComplementos` del legado: listado paginado con filtros Almacén/Usuario/
 * Tipo (Devolución|Complemento)/rango de fechas (regla 18, default hoy/hoy, obligatorio) + un
 * botón de exportación que respeta los filtros activos (mismo criterio que Merma/Ventas, sin
 * modo "exportar todo"). Catálogo de Almacén reusado de `UsuariosService.obtenerAlmacenes`
 * (regla 00), mismo que Merma. Sin buscador de texto libre (paridad con el resto del módulo
 * Reportes, sin modernizar).
 *
 * **Usuario como selector paginado (regla 16):** a diferencia de Almacén (catálogo chico, fijo a
 * una sola sucursal), el catálogo de usuarios puede superar el umbral de `mat-select`; se
 * reutiliza `app-select-paginado` + `UsuariosService.buscarPaginado`, mismo patrón que
 * `ReportesVentasService` usa para su propio filtro de usuario/cajero.
 *
 * **Tipo (tipoTicket):** catálogo fijo de 2 opciones (`TIPO_TICKET_OPTIONS`), sin endpoint
 * dedicado — mismo patrón que `models/facturas/estatus-factura.ts`. El SP no admite "todos" para
 * este filtro; el selector no es limpiable y arranca en Devolución (1), igual que el default del
 * propio SP.
 */
@Component({
  selector: 'app-devolucion-list',
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
    DecimalPipe,
    CurrencyPipe,
  ],
  templateUrl: './devolucion-list.component.html',
})
export class DevolucionListComponent implements OnInit {
  private readonly service = inject(ReportesDevolucionService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('reportesDevolucion') blockUI!: NgBlockUI;
  /** Bloque propio para la exportación (no bloquea/depende del listado). */
  @BlockUI('reportesDevolucionExportar') blockUIExportar!: NgBlockUI;

  readonly displayedColumns = [
    'fechaAlta',
    'descripcion',
    'idVenta',
    'nombreCliente',
    'descAlmacen',
    'codigoBarras',
    'descripcionProducto',
    'cantidad',
    'precioVenta',
    'montoTotal',
    'nombreUsuario',
  ];

  readonly pag = new Paginador<DevolucionItem>(CONSTANTS.PAGINATION.PAGE_SIZE);
  readonly almacenes = signal<Catalogo[]>([]);
  readonly tipoTicketOptions = TIPO_TICKET_OPTIONS;

  // Filtros (equivalentes al legado: almacén, usuario, tipo de ticket, rango de fechas
  // obligatorio). Usuario es catálogo potencialmente grande → selector paginado server-side
  // (regla 16), reusando UsuariosService.buscarPaginado sin métodos nuevos.
  readonly idAlmacen = new FormControl<number | null>(null);
  readonly idUsuario = new FormControl<number | null>(null);
  readonly tipoTicket = new FormControl<number>(TipoTicketId.Devolucion, { nonNullable: true });
  readonly hoy = new Date();
  // Rango de fechas con mat-date-range-input (regla 18): default = hoy/hoy, visible desde la
  // carga inicial; `hoy` como `[max]` para que el propio día de hoy nunca quede excluido.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(this.hoy),
    fin: new FormControl<Date | null>(this.hoy),
  });

  // fetchPage para el selector paginado de usuario (regla 16).
  readonly fetchUsuarios = (q: string, page: number): Observable<unknown[]> =>
    this.usuariosService.buscarPaginado(q, page);

  ngOnInit(): void {
    this.usuariosService.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID).subscribe({
      next: (a) => this.almacenes.set(a),
      error: (err) => console.error('Error al cargar catálogo de almacenes', err),
    });

    this.cargar();
  }

  private get filtros() {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : '',
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : '',
      idAlmacen: this.idAlmacen.value,
      idUsuario: this.idUsuario.value,
      tipoTicket: this.tipoTicket.value,
    };
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('reportesDevolucion.msg.loading'));
    this.service
      .listar({ perPage: this.pag.perPage(), ...this.filtros })
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al listar el reporte de devoluciones', err);
          this.notify.notify('error', this.translate.instant('reportesDevolucion.msg.loadError'));
        },
      });
  }

  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('reportesDevolucion.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar el reporte de devoluciones', err);
          this.notify.notify('error', this.translate.instant('reportesDevolucion.msg.loadError'));
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

  /** Botón "Limpiar": rango de fechas vuelve a hoy/hoy, Tipo vuelve a Devolución, el resto a "Todos". */
  limpiarFiltros(): void {
    this.idAlmacen.reset();
    this.idUsuario.reset();
    this.tipoTicket.setValue(TipoTicketId.Devolucion);
    this.rangoFechasForm.reset({ inicio: this.hoy, fin: this.hoy });
    this.cargar();
  }

  /** Exporta con los filtros activos (mismo criterio que Merma/Ventas: no ignora la pantalla). */
  exportar(): void {
    this.blockUIExportar.start(this.translate.instant('reportesDevolucion.msg.exportando'));
    this.service
      .exportar(this.filtros)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        error: (err) => console.error('Error al exportar el reporte de devoluciones', err),
      });
  }
}
