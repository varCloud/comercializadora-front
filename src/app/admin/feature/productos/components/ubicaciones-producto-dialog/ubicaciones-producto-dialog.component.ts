import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { UbicacionProducto } from 'src/app/admin/models/ventas/ubicacion-producto';
import { AjustarUbicacionRequestModel } from 'src/app/admin/models/productos/ajustar-ubicacion-request';
import { ProductosService } from 'src/app/admin/services/productos.service';

/** Datos que recibe el diálogo: el producto cuyas ubicaciones se consultan/ajustan. */
export interface UbicacionesProductoDialogData {
  idProducto: number;
  descripcion: string;
}

/**
 * Fila de la tabla: la ubicación consultada (regla 00 — reusa `UbicacionProducto` de
 * `admin/models/ventas/`, no se duplica el modelo) + estado editable local (cantidad en
 * físico capturada, checkbox de error de proceso). No es un contrato de API, es solo estado
 * de UI de este diálogo — por eso no vive en `admin/models/` (regla 11 aplica a contratos).
 */
interface FilaUbicacion extends UbicacionProducto {
  cantidadEnFisico: number | null;
  errorHumano: boolean;
}

/**
 * Modal "Ubicaciones del producto" — migración 1:1 del modal legado
 * (`Views/Productos/_UbicacionesProducto.cshtml` + `js/EvtProductos.js`, hallazgo P-01 de la
 * auditoría de paridad de `productos`). Muestra la existencia física del producto por
 * ubicación y permite ajustar la cantidad en físico de una ubicación puntual.
 *
 * Patrón de diálogo: `precios-form-dialog` (estructura/BlockUI). Patrón de tabla de
 * ubicaciones: `ventas/components/consultar-existencias-dialog` (ahí es de solo lectura; acá
 * se agrega la columna editable "Cantidad en Físico" + checkbox "Error de Proceso" + acción
 * "Ajustar").
 *
 * Piso/Pasillo/Raq se fusionan en una sola celda "Sin Acomodar" cuando `sinAcomodar` es true
 * (réplica de `colspan="3"` del legado); se reusa la clase global `.status-badge
 * status-inactivo` ya usada para el mismo estado en `consultar-existencias-dialog` (regla 00)
 * en vez del `color: chocolate` inline del legado.
 *
 * `ajustar()` llama `PATCH /productos/{id}/ubicaciones/{idUbicacion}` (FE-4/API-2). El backend
 * puede responder éxito HTTP con `estatus !== 200` (regla de negocio del SP: ubicación en
 * "proceso interno") — se revisa `estatus`, no el código HTTP, para decidir éxito/error.
 */
@Component({
  selector: 'app-ubicaciones-producto-dialog',
  standalone: true,
  imports: [FormsModule, MaterialModule, TablerIconsModule, TranslatePipe, BlockUIModule],
  templateUrl: './ubicaciones-producto-dialog.component.html',
  styleUrl: './ubicaciones-producto-dialog.component.scss',
})
export class UbicacionesProductoDialogComponent implements OnInit {
  private readonly service = inject(ProductosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<UbicacionesProductoDialogComponent>);
  readonly data = inject<UbicacionesProductoDialogData>(MAT_DIALOG_DATA);

  @BlockUI('ubicacionesProducto') blockUI!: NgBlockUI;

  readonly ubicaciones = signal<FilaUbicacion[]>([]);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.blockUI.start(this.translate.instant('productos.ubicacionesProducto.loading'));
    this.service
      .obtenerUbicaciones(this.data.idProducto)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (ubicaciones) => {
          this.ubicaciones.set(
            ubicaciones.map((u) => ({ ...u, cantidadEnFisico: u.cantidad, errorHumano: false })),
          );
        },
        error: (err) => {
          console.error('Error al cargar las ubicaciones del producto', err);
          this.notify.notify('error', this.translate.instant('productos.ubicacionesProducto.loadError'));
        },
      });
  }

  onCantidadFisicoChange(fila: FilaUbicacion, value: number | string | null): void {
    const cantidadEnFisico = value === '' || value === null ? null : Number(value);
    this.ubicaciones.update((rows) =>
      rows.map((r) => (r.idUbicacion === fila.idUbicacion ? { ...r, cantidadEnFisico } : r)),
    );
  }

  /**
   * Paridad con `esNumero`/`esDecimal` de `Index.js` (legado): bloquea el punto decimal cuando
   * la ubicación no es de `fraccion`, y solo permite un único punto cuando sí lo es. El legado
   * lo hacía con `onkeypress`; acá con `keydown` (evento moderno, `keypress` está deprecado).
   */
  onCantidadFisicoKeydown(event: KeyboardEvent, fraccion: boolean): void {
    const teclasControl = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
    if (teclasControl.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (/^[0-9]$/.test(event.key)) return;
    if (fraccion && event.key === '.' && !(event.target as HTMLInputElement).value.includes('.')) return;
    event.preventDefault();
  }

  onErrorHumanoChange(fila: FilaUbicacion, checked: boolean): void {
    this.ubicaciones.update((rows) =>
      rows.map((r) => (r.idUbicacion === fila.idUbicacion ? { ...r, errorHumano: checked } : r)),
    );
  }

  /**
   * Ajusta el inventario de una ubicación (paridad con `EvtProductos.js::AjustarInventarioProducto`):
   * 1. Cantidad en físico obligatoria. 2. Debe ser distinta a la cantidad actual (si no, "No hay
   * nada que ajustar"). 3. Confirmación previa (SweetAlert2). 4. Llama
   * `PATCH /productos/{id}/ubicaciones/{idUbicacion}`; revisa `estatus` (no el código HTTP) para
   * distinguir éxito de negocio de un rechazo (ej. ubicación en "proceso interno") y refresca la
   * tabla completa (`cargar()`) solo en éxito.
   */
  ajustar(fila: FilaUbicacion): void {
    if (fila.cantidadEnFisico === null || fila.cantidadEnFisico === undefined) {
      this.notify.notify('warning', this.translate.instant('productos.ubicacionesProducto.msg.cantidadRequerida'));
      return;
    }

    const cantidadEnFisico = fila.cantidadEnFisico;
    if (cantidadEnFisico === fila.cantidad) {
      this.notify.notify('warning', this.translate.instant('productos.ubicacionesProducto.msg.sinCambios'));
      return;
    }

    Swal.fire({
      title: this.translate.instant('productos.ubicacionesProducto.confirm.title'),
      text: this.translate.instant('productos.ubicacionesProducto.confirm.text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('productos.ubicacionesProducto.confirm.accept'),
      cancelButtonText: this.translate.instant('productos.ubicacionesProducto.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;

      const request = new AjustarUbicacionRequestModel({
        cantidadEnFisico,
        errorHumano: fila.errorHumano,
      });

      this.blockUI.start(this.translate.instant('productos.ubicacionesProducto.ajustando'));
      this.service
        .ajustarUbicacion(this.data.idProducto, fila.idUbicacion, request)
        .pipe(finalize(() => this.blockUI.stop()))
        .subscribe({
          next: (res) => {
            // El SP puede responder 200 HTTP con estatus de negocio distinto de 200 (ej.
            // ubicación en "proceso interno") — se revisa estatus, no el código HTTP.
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
              this.cargar();
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('productos.ubicacionesProducto.msg.ajustarFallback'),
              );
            }
          },
          error: (err) => {
            console.error('Error al ajustar el inventario de la ubicación', err);
            this.notify.notify(
              'error',
              this.translate.instant('productos.ubicacionesProducto.msg.ajustarFallback'),
            );
          },
        });
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
