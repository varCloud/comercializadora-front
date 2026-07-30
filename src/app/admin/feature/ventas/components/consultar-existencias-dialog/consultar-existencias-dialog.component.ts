import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { TablerIconsModule } from 'angular-tabler-icons';
import { finalize, forkJoin } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ProductoVenta } from 'src/app/admin/models/ventas/producto-venta';
import { UbicacionProducto } from 'src/app/admin/models/ventas/ubicacion-producto';
import { PreciosProducto } from 'src/app/admin/models/productos/precios-producto';
import { ProductosService } from 'src/app/admin/services/productos.service';

/** Datos que recibe el modal al abrirse: el catálogo YA cargado en memoria del POS (regla 00 —
 * evita una llamada HTTP nueva; el buscador de este diálogo filtra sobre ese mismo arreglo,
 * igual que `PosComponent.sugerenciasPorNombre`). */
export interface ConsultarExistenciasDialogData {
  productos: ProductoVenta[];
}

/**
 * Diálogo "Consultar Existencias" del POS (feature Ventas, Bloque E gap-fix, tarea FE-E3).
 * El cajero busca un producto por nombre DENTRO del propio modal (réplica del flujo legado:
 * `_UbicacionesProductoPrecio.cshtml`), y al seleccionarlo se consulta en paralelo su ubicación
 * física por almacén (`ProductosService.obtenerUbicaciones`, API-E2) y sus precios
 * (`ProductosService.obtenerPrecios`, ya migrado — regla 00, no se duplica la llamada).
 * Es de solo lectura: no modifica el ticket ni la venta.
 */
@Component({
  selector: 'app-consultar-existencias-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, TranslatePipe, BlockUIModule, CurrencyPipe],
  templateUrl: './consultar-existencias-dialog.component.html',
})
export class ConsultarExistenciasDialogComponent {
  private readonly productosService = inject(ProductosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<ConsultarExistenciasDialogComponent>);
  readonly data = inject<ConsultarExistenciasDialogData>(MAT_DIALOG_DATA);

  @BlockUI('consultarExistencias') blockUI!: NgBlockUI;

  readonly buscarControl = new FormControl<ProductoVenta | string>('', { nonNullable: true });
  private readonly termino = toSignal(this.buscarControl.valueChanges, {
    initialValue: '' as ProductoVenta | string,
  });

  readonly sugerencias = computed(() => {
    const valor = this.termino();
    const texto = (typeof valor === 'string' ? valor : '').trim().toUpperCase();
    if (!texto) return [];
    return this.data.productos.filter((p) => p.descripcion.toUpperCase().includes(texto)).slice(0, 15);
  });

  readonly productoConsultado = signal<ProductoVenta | null>(null);
  readonly ubicaciones = signal<UbicacionProducto[]>([]);
  readonly precios = signal<PreciosProducto | null>(null);

  readonly displayedColumns = ['almacen', 'pasillo', 'raq', 'piso', 'cantidad'];

  /** `displayWith` del autocomplete. */
  mostrarProducto(valor: ProductoVenta | string | null): string {
    if (!valor || typeof valor === 'string') return valor ?? '';
    return valor.descripcion;
  }

  onProductoSeleccionado(event: MatAutocompleteSelectedEvent): void {
    const producto = event.option.value as ProductoVenta;
    this.consultar(producto);
  }

  private consultar(producto: ProductoVenta): void {
    this.blockUI.start(this.translate.instant('ventas.pos.existencias.msg.consultando'));
    forkJoin([
      this.productosService.obtenerUbicaciones(producto.idProducto),
      this.productosService.obtenerPrecios(producto.idProducto),
    ])
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: ([ubicaciones, precios]) => {
          this.productoConsultado.set(producto);
          this.ubicaciones.set(ubicaciones);
          this.precios.set(precios);
        },
        error: (err) => {
          console.error('Error al consultar existencias del producto', err);
          this.notify.notify('error', this.translate.instant('ventas.pos.existencias.msg.error'));
        },
      });
  }

  /** Vuelve a la búsqueda (limpia el resultado actual para consultar otro producto). */
  nuevaBusqueda(): void {
    this.productoConsultado.set(null);
    this.ubicaciones.set([]);
    this.precios.set(null);
    this.buscarControl.setValue('');
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
