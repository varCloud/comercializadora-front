import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize, Observable } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Producto } from 'src/app/admin/models/productos/producto';
import { ProductoCodigoBarraModel } from 'src/app/admin/models/productos/producto-codigo-barra';
import { ProductosService } from 'src/app/admin/services/productos.service';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';

/**
 * Generador de etiquetas de código de barras de productos (migra la pantalla legada
 * Productos/CodigosDeBarras). El usuario arma una lista de productos —uno a uno (autocomplete
 * paginado) o una línea completa— y genera un PDF imprimible con una etiqueta por producto
 * (barra CODE_128 + precios Menudeo/Mayoreo). El PDF llega como Blob y se abre en pestaña nueva.
 */
@Component({
  selector: 'app-codigos-barras',
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    NgSelectModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    CurrencyPipe,
    SelectPaginadoComponent,
  ],
  templateUrl: './codigos-barras.component.html',
  styleUrl: './codigos-barras.component.scss',
})
export class CodigosBarrasComponent implements OnInit {
  private readonly service = inject(ProductosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('codigosBarras') blockUI!: NgBlockUI;

  /** Catálogo de líneas (≤25 → ng-select con filtro cliente, regla 16). */
  readonly lineas = signal<Catalogo[]>([]);
  readonly lineaControl = new FormControl<number | null>(null);

  /** Selector paginado de productos (~1948 → app-select-paginado, regla 16). */
  readonly productoControl = new FormControl<Producto | null>(null);
  private readonly productoSeleccionado = signal<Producto | null>(null);

  /** Productos que entrarán en el PDF. */
  readonly filas = signal<Producto[]>([]);
  readonly generando = signal(false);

  readonly displayedColumns = [
    'posicion',
    'idProducto',
    'descripcion',
    'linea',
    'menudeo',
    'mayoreo',
    'codigoBarras',
    'action',
  ];

  /** fetchPage para el selector paginado de productos (búsqueda server-side). */
  readonly fetchProductos = (q: string, page: number): Observable<Producto[]> =>
    this.service.buscarPaginado(q, page);

  ngOnInit(): void {
    this.cargarLineas();
  }

  private cargarLineas(): void {
    this.blockUI.start();
    this.service
      .obtenerLineas()
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (lineas) => this.lineas.set(lineas),
        error: (err) => {
          console.error('Error al cargar líneas de producto', err);
          this.notify.notify('error', this.translate.instant('productos.codigosBarras.msg.loadError'));
        },
      });
  }

  /** Captura el producto seleccionado en el selector paginado (objeto completo). */
  onProductoSelected(item: unknown): void {
    this.productoSeleccionado.set((item as Producto) ?? null);
  }

  /** Agrega el producto seleccionado a la tabla. */
  agregarProducto(): void {
    const producto = this.productoSeleccionado();
    if (!producto) {
      this.notify.notify('warning', this.translate.instant('productos.codigosBarras.msg.seleccionaProducto'));
      return;
    }
    this.filas.update((f) => [...f, producto]);
    this.productoControl.reset();
    this.productoSeleccionado.set(null);
  }

  /** Agrega todos los productos activos de la línea seleccionada. */
  agregarLinea(): void {
    const idLinea = this.lineaControl.value;
    if (!idLinea) {
      this.notify.notify('warning', this.translate.instant('productos.codigosBarras.msg.seleccionaLinea'));
      return;
    }

    this.blockUI.start(this.translate.instant('productos.codigosBarras.msg.agregandoLinea'));
    this.service
      .obtenerProductosPorLinea(idLinea)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (productos) => {
          if (productos.length === 0) {
            this.notify.notify('warning', this.translate.instant('productos.codigosBarras.msg.lineaSinProductos'));
            return;
          }
          this.filas.update((f) => [...f, ...productos]);
        },
        error: (err) => {
          console.error('Error al obtener productos por línea', err);
          this.notify.notify('error', this.translate.instant('productos.codigosBarras.msg.lineaError'));
        },
      });
  }

  eliminar(index: number): void {
    this.filas.update((f) => f.filter((_, i) => i !== index));
  }

  limpiar(): void {
    this.filas.set([]);
  }

  /** Genera el PDF de etiquetas y lo abre en una pestaña nueva. */
  generar(): void {
    if (this.filas().length === 0) {
      this.notify.notify('warning', this.translate.instant('productos.codigosBarras.msg.sinProductos'));
      return;
    }

    const payload = this.filas().map((p) => ProductoCodigoBarraModel.fromProducto(p));

    this.generando.set(true);
    this.blockUI.start(this.translate.instant('productos.codigosBarras.msg.generando'));
    this.service
      .generarCodigosBarras(payload)
      .pipe(
        finalize(() => {
          this.blockUI.stop();
          this.generando.set(false);
        }),
      )
      .subscribe({
        next: (blob) => this.abrirPdf(blob),
        error: (err) => {
          console.error('Error al generar el PDF de códigos de barras', err);
          this.notify.notify('error', this.translate.instant('productos.codigosBarras.msg.generarError'));
        },
      });
  }

  private abrirPdf(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
