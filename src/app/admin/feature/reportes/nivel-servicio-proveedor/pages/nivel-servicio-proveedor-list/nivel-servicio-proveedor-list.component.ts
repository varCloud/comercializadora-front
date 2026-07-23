import { DecimalPipe, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs/operators';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { NotificationService } from 'src/app/services/notification.service';
import { Paginador } from 'src/app/admin/models/shared/paginador';
import { PaginadorComponent } from 'src/app/admin/shared/components/paginador/paginador.component';
import { NivelServicioProveedorItem } from 'src/app/admin/models/reportes-nivel-servicio-proveedor/nivel-servicio-proveedor-item';
import { NivelServicioProveedorSearchParams } from 'src/app/admin/models/reportes-nivel-servicio-proveedor/nivel-servicio-proveedor-search-params';
import { ReportesNivelServicioProveedorService } from 'src/app/admin/services/reportes-nivel-servicio-proveedor.service';

/**
 * Pantalla "Reportes > Nivel de Servicio Proveedor" (FE-4, servicio HTTP real). Migra
 * `ReportesController.NivelServicioProveedor/ObtenerNivelServicioProveedor` del legado: por
 * proveedor y en un rango de fechas, cuántos pedidos de compra se atendieron correctos vs.
 * incompletos y el % de pedidos atendidos.
 *
 * **Paginación server-side** (regla 10, decisión de la HU pese al volumen bajo de proveedores —
 * consistencia con `margen_bruto`): `navegar()`/`onPerPage()` llaman al servicio (`irLink`/
 * `listar`), no se pagina en memoria.
 *
 * ⚠️ Excepción documentada a la regla 18 (rango de fechas) — sentido **inverso** al de
 * `MargenBrutoListComponent` (ahí el rango es obligatorio): aquí el rango es **opcional**. El
 * default estándar de la regla 18 es hoy/hoy visible desde la carga inicial; aquí NO se aplica:
 * los controles arrancan en `null`/`null` (sin fechas = histórico completo, verificado con la API
 * real — no responde `400`) y el botón "Buscar" **nunca** se deshabilita por falta de fechas.
 * `[max]="hoy"` se conserva para que el usuario no pueda elegir fechas futuras si decide filtrar,
 * pero no hay `Validators.required`.
 */
@Component({
  selector: 'app-nivel-servicio-proveedor-list',
  standalone: true,
  imports: [
    MaterialModule,
    MatNativeDateModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    ReactiveFormsModule,
    PaginadorComponent,
    DecimalPipe,
  ],
  templateUrl: './nivel-servicio-proveedor-list.component.html',
})
export class NivelServicioProveedorListComponent implements OnInit {
  private readonly service = inject(ReportesNivelServicioProveedorService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  @BlockUI('reportesNivelServicioProveedor') blockUI!: NgBlockUI;
  /** Bloque propio para la exportación (no bloquea/depende del listado). */
  @BlockUI('reportesNivelServicioProveedorExportar') blockUIExportar!: NgBlockUI;

  readonly displayedColumns = [
    'idProveedor',
    'nombre',
    'totalPedidosCompletos',
    'totalPedidosIncompletos',
    'totalPedidosTotales',
    'porcAtendido',
  ];

  readonly pag = new Paginador<NivelServicioProveedorItem>(CONSTANTS.PAGINATION.PAGE_SIZE);

  readonly hoy = new Date();
  // Rango de fechas OPCIONAL (excepción a la regla 18 estándar, ver comentario de la clase):
  // sin default hoy/hoy, arranca vacío y "Buscar" nunca queda bloqueado por falta de fechas.
  readonly rangoFechasForm = this.fb.group({
    inicio: new FormControl<Date | null>(null),
    fin: new FormControl<Date | null>(null),
  });

  ngOnInit(): void {
    // Sin filtro de fechas = histórico completo (ver HU): la carga inicial ya consulta así.
    this.buscar();
  }

  private get filtros(): NivelServicioProveedorSearchParams {
    const { inicio, fin } = this.rangoFechasForm.value;
    return {
      fechaIni: inicio ? formatDate(inicio, 'yyyy-MM-dd', 'en-US') : null,
      fechaFin: fin ? formatDate(fin, 'yyyy-MM-dd', 'en-US') : null,
      perPage: this.pag.perPage(),
    };
  }

  /** Consulta el servicio HTTP real con los filtros activos (server-side, página 1). */
  cargar(): void {
    this.blockUI.start(this.translate.instant('reportesNivelServicioProveedor.msg.loading'));
    this.service
      .listar(this.filtros)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al consultar el reporte de nivel de servicio proveedor', err);
          this.notify.notify('error', this.translate.instant('reportesNivelServicioProveedor.msg.loadError'));
        },
      });
  }

  /** Botón "Buscar": aplica los filtros del formulario (sin bloquear por fechas vacías). */
  buscar(): void {
    this.cargar();
  }

  /** Botón "Limpiar": rango de fechas vuelve a vacío (sin default, ver clase) = histórico completo. */
  limpiarFiltros(): void {
    this.rangoFechasForm.reset({ inicio: null, fin: null });
    this.cargar();
  }

  /** Paginación server-side: `url` es el link first/prev/next/last devuelto por la API. */
  navegar(url: string): void {
    this.blockUI.start(this.translate.instant('reportesNivelServicioProveedor.msg.loading'));
    this.service
      .irLink(url)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.pag.setPage(res),
        error: (err) => {
          console.error('Error al paginar el reporte de nivel de servicio proveedor', err);
          this.notify.notify('error', this.translate.instant('reportesNivelServicioProveedor.msg.loadError'));
        },
      });
  }

  /** Cambio de tamaño de página: recarga desde la página 1 con el nuevo `perPage` (server-side). */
  onPerPage(perPage: number): void {
    this.pag.meta.update((m) => ({ ...m, perPage }));
    this.cargar();
  }

  /**
   * Botón "Exportar a CSV": respeta el rango de fechas activo e ignora la paginación. Maneja el
   * caso de descarga inmediata y el de envío diferido por correo (el propio servicio distingue
   * ambos y notifica al usuario, ver `ReportesNivelServicioProveedorService.exportarCSV`).
   * Deshabilitado en la plantilla si no hay datos en la tabla (`pag.isEmpty()`).
   */
  exportar(): void {
    this.blockUIExportar.start(this.translate.instant('reportesNivelServicioProveedor.msg.exportando'));
    this.service
      .exportarCSV(this.filtros)
      .pipe(finalize(() => this.blockUIExportar.stop()))
      .subscribe({
        // El servicio ya notifica al usuario (info "envío por correo" o error, ver
        // `ReportesNivelServicioProveedorService.procesarErrorExportacion`); aquí solo se loguea.
        error: (err) => console.error('Error al exportar el reporte de nivel de servicio proveedor', err),
      });
  }
}
