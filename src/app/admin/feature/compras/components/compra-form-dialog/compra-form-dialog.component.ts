import { DecimalPipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { Observable, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import {
  ENUM_ESTATUS_MODAL,
  ResultModalModel,
} from 'src/app/models/result-modal';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { Producto } from 'src/app/admin/models/productos/producto';
import {
  CompraProducto,
  CompraProductoModel,
} from 'src/app/admin/models/compras/compra-producto';
import { EstatusCompra } from 'src/app/admin/models/compras/estatus-compra';
import { GuardarCompraRequestModel } from 'src/app/admin/models/compras/guardar-compra-request';
import { ComprasService } from 'src/app/admin/services/compras.service';
import { ProductosService } from 'src/app/admin/services/productos.service';
import { ProveedoresService } from 'src/app/admin/services/proveedores.service';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { ProveedorFormDialogComponent } from 'src/app/admin/feature/proveedores/components/proveedor-form-dialog/proveedor-form-dialog.component';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';

/** Datos que recibe el modal al abrirse. */
export interface CompraFormData {
  idCompra: number;
}

/**
 * Modal de alta/edición de Compra. Réplica fiel de _Compra.cshtml + TODOS los eventos de
 * EvtConsultaCompras.js (cadena de foco con Enter, autocompletado del producto, cálculo
 * cantidad ↔ cantidad por unidad de compra con `fraccion`, no duplicar producto, actualizaTicket,
 * eliminaFila, reglas de editabilidad por estatus, guardar con confirmación) sobre el stack
 * Angular/Material del repo. Estatus: 1 Pendiente · 2 Realizada · 3 Finalizada · 4 Cancelada.
 */
@Component({
  selector: 'app-compra-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    TablerIconsModule,
    TranslatePipe,
    BlockUIModule,
    DecimalPipe,
    SelectPaginadoComponent,
    NgSelectModule,
  ],
  templateUrl: './compra-form-dialog.component.html',
  styleUrl: './compra-form-dialog.component.scss',
})
export class CompraFormDialogComponent implements AfterViewInit {

  @ViewChild('idAlmacenSelect') myAlmacenSelect!: NgSelectComponent;
  @ViewChild('productoSelect') myProductoSelectSelect!: SelectPaginadoComponent;


  private readonly comprasService = inject(ComprasService);
  private readonly productosService = inject(ProductosService);
  private readonly proveedoresService = inject(ProveedoresService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<CompraFormDialogComponent>);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly data = inject<CompraFormData>(MAT_DIALOG_DATA);

  @BlockUI('compraForm') blockUI!: NgBlockUI;

  // --- Estado de la compra ---
  readonly idCompra = signal(0);
  readonly idStatus = signal(0); // estatus actual de la compra (0 = nueva)
  readonly saving = signal(false);

  /** Editable si el estatus es <= 2 (Pendiente/Realizada). Estatus > 2 => solo lectura. */
  readonly puedeEditar = computed(() => this.idStatus() <= 2);
  /** El bloque de alta de línea (almacén/producto/costos) se muestra con estatus <= 1. */
  readonly mostrarAltaLinea = computed(() => this.idStatus() <= 1);
  /** El botón guardar se muestra con estatus <= 2. */
  readonly mostrarGuardar = computed(() => this.idStatus() <= 2);
  readonly esNueva = computed(() => this.idCompra() === 0);

  // --- Catálogos ---
  readonly almacenes = signal<Catalogo[]>([]);
  private estatusTodos: EstatusCompra[] = [];
  /** Opciones de estatus filtradas por el estatus actual (regla del legado). */
  readonly estatusOpciones = signal<EstatusCompra[]>([]);

  // --- Cabecera (controles) ---
  readonly idAlmacen = new FormControl<number | null>(null);
  readonly idProveedor = new FormControl<number | null>(null);
  readonly idStatusCompra = new FormControl<number | null>(null);
  readonly observaciones = new FormControl<string>('');
  readonly almacenBloqueado = signal(false);
  readonly proveedorPreload = signal<unknown[]>([]);

  // --- Alta de línea (controles) ---
  readonly idProducto = new FormControl<null | null>(null);
  readonly precio = new FormControl<number | null>(0);
  readonly cantPorUnidadCompra = new FormControl<number | null>(0);
  readonly cantidad = new FormControl<number | null>(0);
  readonly unidadCompra = signal('');
  readonly cantidadUnidadCompra = signal<number | null>(null);
  readonly unidadVenta = signal('');
  private productoSeleccionado: Producto | null = null;

  // --- Detalle ---
  readonly rows = signal<CompraProducto[]>([]);
  readonly total = signal(0);

  // fetchPage de los selectores paginados (regla 16).
  readonly fetchProveedores = (q: string, page: number): Observable<unknown[]> =>
    this.proveedoresService.buscarPaginado(q, page);
  readonly fetchProductos = (q: string, page: number): Observable<unknown[]> =>
    this.productosService.buscarPaginado(q, page);

  constructor() {
    this.idCompra.set(this.data?.idCompra ?? 0);

    // Catálogos base.
    this.comprasService.obtenerAlmacenes().subscribe({
      next: (lista) => this.almacenes.set(lista),
      error: (err) => console.error('Error al cargar almacenes', err),
    });

    this.comprasService.obtenerEstatus().subscribe({
      next: (lista) => {
        this.estatusTodos = lista;
        this.recalcularOpcionesEstatus();
      },
      error: (err) => console.error('Error al cargar estatus de compra', err),
    });

    if (this.idCompra() > 0) {
      this.cargarCompra(this.idCompra());
    } else {
      this.recalcularOpcionesEstatus();
    }
  }

  ngAfterViewInit(): void {
    //SI id compra es mayor que cero es una edicion
    if (this.idCompra() == 0) {
      this.myAlmacenSelect.open();
    }

  }


  // ====================== Carga (edición) ======================

  onAlmacenChange($event: any): void {
    this.myProductoSelectSelect.openSelect();
  }

  private cargarCompra(id: number): void {
    this.blockUI.start(this.translate.instant('compras.msg.loading'));
    this.comprasService
      .obtenerPorId(id)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (compra) => {
          if (!compra) {
            this.notify.notify('error', this.translate.instant('compras.msg.loadError'));
            return;
          }
          this.idStatus.set(compra.idStatus);
          this.idAlmacen.setValue(compra.idAlmacen);
          this.idProveedor.setValue(compra.idProveedor);
          this.idStatusCompra.setValue(compra.idStatus);
          this.observaciones.setValue(compra.observaciones);
          this.rows.set(compra.listProductos.map((p) => new CompraProductoModel(p)));

          // En edición el almacén queda bloqueado (no se cambia) y se siembra el proveedor.
          this.almacenBloqueado.set(true);
          this.idAlmacen.disable();
          this.proveedorPreload.set([
            { idProveedor: compra.idProveedor, nombre: compra.proveedorNombre },
          ]);

          if (!this.puedeEditar()) {
            this.idProveedor.disable();
            this.idStatusCompra.disable();
            this.observaciones.disable();
          }

          this.recalcularOpcionesEstatus();
          this.actualizaTicket();
        },
        error: (err) => {
          console.error('Error al cargar la compra', err);
          this.notify.notify('error', this.translate.instant('compras.msg.loadError'));
        },
      });
  }

  /**
   * Filtra las opciones de estatus según el estatus actual (replica _Compra.cshtml):
   *  - actual = 1 (Pendiente) o nueva → {1 Pendiente, 4 Cancelada}
   *  - actual = 2 (Realizada)        → {2 Realizada, 3 Finalizada}
   *  - actual > 2                     → solo lectura (sin opciones de cambio)
   */
  private recalcularOpcionesEstatus(): void {
    const actual = this.idStatus();
    let permitidos: number[];
    if (actual === 1 || this.esNueva()) {
      permitidos = [1, 4];
    } else if (actual === 2) {
      permitidos = [2, 3];
    } else {
      permitidos = this.estatusTodos.map((e) => e.idStatus); // solo lectura, muestra el actual
    }
    this.estatusOpciones.set(
      this.estatusTodos.filter((e) => permitidos.includes(e.idStatus)),
    );
  }

  // ====================== Eventos de la línea de alta ======================

  /** Al elegir un producto se autocompletan los campos (idProducto change del legado). */
  onProductoSeleccionado(item: unknown): void {
    const producto = item as Producto | null;
    this.productoSeleccionado = producto ?? null;
    if (!producto) {
      return;
    }
    this.unidadCompra.set(producto.descripcionUnidadCompra ?? '');
    this.cantidadUnidadCompra.set(producto.cantidadUnidadCompra ?? 0);
    this.unidadVenta.set(producto.descripcionUnidadMedida ?? '');
    this.precio.setValue(producto.ultimoCostoCompra ?? 0);
    this.cantPorUnidadCompra.setValue(0);
    this.cantidad.setValue(0);
    this.focusEl('precio')
  }

  /** Cantidad (por unidad de compra) → calcula Cantidad Comprada. */
  onCantPorUnidadBlur(): void {
    const cu = parseInt(String(this.cantidadUnidadCompra() ?? 0), 10);
    const cpu = parseFloat(String(this.cantPorUnidadCompra.value ?? 0));
    let cantidad = 0;
    if (this.productoSeleccionado) {
      cantidad = this.productoSeleccionado.fraccion
        ? this.roundToTwo(cu * cpu)
        : Math.round(cu * cpu);
    }
    this.cantidad.setValue(cantidad);
  }

  /** Cantidad Comprada → recalcula Cantidad (por unidad de compra). Inverso del anterior. */
  onCantidadBlur(): void {
    const cu = parseInt(String(this.cantidadUnidadCompra() ?? 0), 10);
    const cc = this.productoSeleccionado?.fraccion
      ? parseFloat(String(this.cantidad.value ?? 0))
      : parseInt(String(this.cantidad.value ?? 0), 10);
    const cpu = cu > 0 ? this.roundToTwo(cc / cu) : cc;
    this.cantPorUnidadCompra.setValue(cpu);
  }

  /** Agregar Producto: validaciones, no duplicar, agregar fila y limpiar la línea. */
  agregarProducto(): void {
    const idAlmacen = Number(this.idAlmacen.value ?? 0);
    const idProducto = Number(this.idProducto.value ?? 0);
    const precio = Number(this.precio.value ?? 0);
    const cantidad = Number(this.cantidad.value ?? 0);

    if (idAlmacen <= 0) {
      this.notify.notify('warning', this.translate.instant('compras.msg.almacenRequerido'));
      return;
    }
    if (idProducto <= 0) {
      this.notify.notify('warning', this.translate.instant('compras.msg.productoRequerido'));
      return;
    }
    if (precio === 0) {
      this.notify.notify('warning', this.translate.instant('compras.msg.costoMayorCero'));
      return;
    }
    if (cantidad === 0) {
      this.notify.notify('warning', this.translate.instant('compras.msg.cantidadMayorCero'));
      return;
    }

    if (this.rows().some((r) => r.idProducto === idProducto)) {
      this.notify.notify('error', this.translate.instant('compras.msg.productoDuplicado'));
      return;
    }

    const nueva = new CompraProductoModel({
      idProducto,
      descripcion: this.productoSeleccionado?.descripcion ?? '',
      idEstatusProducto: 0,
      estatusProducto: 'Pendiente',
      observaciones: '',
      cantidadRecibida: 0,
      cantidadDevuelta: 0,
      cantidad,
      precio,
      fraccion: this.productoSeleccionado?.fraccion ?? false,
    });
    this.rows.update((rows) => [...rows, nueva]);

    // Tras agregar el primer producto se bloquea el almacén.
    this.almacenBloqueado.set(true);
    this.idAlmacen.disable();

    // Limpia la línea de alta.
    this.idProducto.setValue(null);
    this.productoSeleccionado = null;
    this.precio.setValue(0);
    this.cantidad.setValue(0);
    this.unidadCompra.set('');
    this.cantidadUnidadCompra.set(null);
    this.unidadVenta.set('');
    this.cantPorUnidadCompra.setValue(null);
    this.myProductoSelectSelect.openSelect();
    this.actualizaTicket();
  }

  // ====================== Detalle / totales ======================

  /** ¿La cantidad de la fila es de solo lectura? (producto ya recibido o compra no editable). */
  cantidadReadonly(row: CompraProducto): boolean {
    return row.idEstatusProducto > 0 || !this.puedeEditar();
  }

  /** ¿El costo de la fila es de solo lectura? (compra no editable). */
  costoReadonly(): boolean {
    return !this.puedeEditar();
  }

  /** Total de una fila: usa cantidad recibida si la compra está Realizada(2)/Finalizada(3). */
  totalFila(row: CompraProducto): number {
    const status = Number(this.idStatusCompra.value ?? 0);
    const cant = status === 3 || status === 2 ? row.cantidadRecibida : row.cantidad;
    return this.roundToTwo(Number(row.precio) * Number(cant));
  }

  /** Recalcula los totales por fila y el total general (actualizaTicket del legado). */
  actualizaTicket(): void {
    let total = 0;
    for (const row of this.rows()) {
      row.total = this.totalFila(row);
      total += row.total;
    }
    this.total.set(this.roundToTwo(total));
  }

  /** Color del badge de estatus por producto (replica _Compra.cshtml: 0 pend, 1 ok, 2 warn, 3/4/5 error). */
  estatusProductoColor(row: CompraProducto): string {
    switch (row.idEstatusProducto) {
      case 1:
        return '#13deb9';
      case 2:
        return '#ffae1f';
      case 3:
      case 4:
      case 5:
        return '#e53935';
      default:
        return '#7b8893';
    }
  }

  /** eliminaFila: no se puede eliminar un producto ya recibido (idEstatusProducto != 0). */
  eliminarFila(row: CompraProducto): void {
    if (row.idEstatusProducto !== 0) {
      this.notify.notify('error', this.translate.instant('compras.msg.noEliminarRecibido'));
      return;
    }
    this.rows.update((rows) => rows.filter((r) => r.idProducto !== row.idProducto));
    this.actualizaTicket();
    if (this.rows().length === 0) {
      this.almacenBloqueado.set(false);
      this.idAlmacen.enable();
      this.myAlmacenSelect.open();
    }
  }

  // ====================== Cabecera ======================

  /** Al cambiar el estatus seleccionado se recalcula el total (cantidad vs. recibida). */
  onEstatusCambio(): void {
    this.actualizaTicket();
  }

  /** Limpiar (solo en alta): vacía detalle y resetea cabecera. */
  limpiar(): void {
    this.rows.set([]);
    this.idProveedor.setValue(null);
    this.idStatusCompra.setValue(null);
    this.almacenBloqueado.set(false);
    this.idAlmacen.enable();
    this.idAlmacen.setValue(null);
    this.actualizaTicket();
  }

  // ====================== Nuevo proveedor ======================

  nuevoProveedor(): void {
    const ref = this.dialog.open(ProveedorFormDialogComponent, {
      data: {},
      width: '700px',
      maxWidth: '95vw',
      disableClose: true,
    });
    ref.afterClosed().subscribe((res) => {
      if (res?.status === ENUM_ESTATUS_MODAL.OK) {
        // El alta no devuelve el id; se limpia el preload para que el nuevo sea buscable.
        this.proveedorPreload.set([]);
        this.notify.notify('info', this.translate.instant('compras.msg.proveedorCreado'));
      }
    });
  }

  // ====================== Guardar ======================

  guardar(): void {
    if (!this.idProveedor.value) {
      this.notify.notify('warning', this.translate.instant('compras.msg.proveedorRequerido'));
      return;
    }
    if (!this.idStatusCompra.value) {
      this.notify.notify('warning', this.translate.instant('compras.msg.estatusRequerido'));
      return;
    }

    const productos: { idProducto: number; cantidad: number; precio: number }[] = [];
    for (const row of this.rows()) {
      if (Number(row.cantidad) === 0) {
        this.notify.notify(
          'warning',
          this.translate.instant('compras.msg.cantidadFilaMayorCero', { producto: row.descripcion }),
        );
        return;
      }
      if (Number(row.precio) === 0) {
        this.notify.notify(
          'warning',
          this.translate.instant('compras.msg.costoFilaMayorCero', { producto: row.descripcion }),
        );
        return;
      }
      productos.push({
        idProducto: row.idProducto,
        cantidad: Number(row.cantidad),
        precio: Number(row.precio),
      });
    }

    if (productos.length === 0) {
      this.notify.notify('warning', this.translate.instant('compras.msg.sinProductos'));
      return;
    }

    Swal.fire({
      title: '',
      text: this.idCompra() > 0
        ? this.translate.instant('compras.confirm.updateText')
        : this.translate.instant('compras.confirm.saveText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('compras.confirm.accept'),
      cancelButtonText: this.translate.instant('compras.confirm.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) return;

      const request = new GuardarCompraRequestModel({
        idCompra: this.idCompra(),
        idProveedor: Number(this.idProveedor.value),
        idStatusCompra: Number(this.idStatusCompra.value),
        observaciones: this.observaciones.value ?? '',
        idAlmacen: Number(this.idAlmacen.value ?? 0),
        productos,
      });

      const peticion$ = this.idCompra() > 0
        ? this.comprasService.actualizar(request.idCompra, request)
        : this.comprasService.crear(request);

      this.saving.set(true);
      this.blockUI.start(this.translate.instant('compras.msg.saving'));
      peticion$
        .pipe(finalize(() => {
          this.saving.set(false);
          this.blockUI.stop();
        }))
        .subscribe({
          next: (res) => {
            if (res?.estatus === 200) {
              this.notify.notify('success', res.mensaje ?? '');
              this.dialogRef.close(
                new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, message: res.mensaje }),
              );
            } else {
              this.notify.notify(
                'error',
                res?.mensaje ?? this.translate.instant('compras.msg.saveFallback'),
              );
            }
          },
          error: (err) => {
            console.error('Error al guardar la compra', err);
            this.notify.notify('error', this.translate.instant('compras.msg.saveError'));
          },
        });
    });
  }

  cerrar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }

  // ====================== Cadena de foco con Enter ======================

  /** Mueve el foco al elemento con el id indicado dentro del modal (cadena del legado). */
  focusEl(id: string): void {
    const el = this.host.nativeElement.querySelector(`#${id}`) as HTMLElement | null;
    el?.focus();
  }

  private roundToTwo(n: number): number {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }
}
