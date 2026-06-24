import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { Observable, finalize } from 'rxjs';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import {
  ENUM_ESTATUS_MODAL,
  ResultModalModel,
} from 'src/app/models/result-modal';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { Producto } from 'src/app/admin/models/productos/producto';
import { ClaveSat, ClaveSatModel } from 'src/app/admin/models/productos/clave-sat';
import { GuardarProductoRequestModel } from 'src/app/admin/models/productos/guardar-producto-request';
import { ProductosService } from 'src/app/admin/services/productos.service';

/** Datos que recibe el diálogo al abrirse. */
export interface ProductoFormData {
  producto?: Producto;
  readonly?: boolean;
}

@Component({
  selector: 'app-producto-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, TranslatePipe, NgSelectModule, SelectPaginadoComponent],
  templateUrl: './producto-form-dialog.component.html',
})
export class ProductoFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProductosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<ProductoFormDialogComponent>);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = inject<ProductoFormData>(MAT_DIALOG_DATA);

  /** Vista previa de los códigos (data URLs) generados del artículo, como el legado. */
  readonly barcodeUrl = signal<string | null>(null);
  readonly qrUrl = signal<string | null>(null);

  readonly lineas = signal<Catalogo[]>([]);
  readonly unidadesMedida = signal<Catalogo[]>([]);
  readonly unidadesCompra = signal<Catalogo[]>([]);

  // Clave SAT: catálogo ~52k → ng-select paginado en scroll (componente app-select-paginado).
  readonly claveSatPreload = signal<ClaveSat[]>([]);
  
  /** Trae una página de claves SAT desde el server (la pide el componente al hacer scroll). */
  readonly fetchClavesSat = (q: string, page: number): Observable<ClaveSat[]> => this.service.buscarClavesSat(q, page);

  readonly saving = signal(false);
  readonly isEdit = !!this.data?.producto;
  readonly readonly = !!this.data?.readonly;

  readonly form = this.fb.group({
    descripcion: ['', Validators.required],
    articulo: ['', Validators.required],
    codigoBarras: [''],
    idLineaProducto: [null as number | null, Validators.required],
    claveProdServ: [null as string | null, Validators.required],
    idUnidadMedida: [0, Validators.min(1)],
    cantidadUnidadMedida: [1],
    idUnidadCompra: [null as number | null],
    cantidadUnidadCompra: [null as number | null],
  });

  get titleKey(): string {
    if (this.readonly) return 'productos.form.titleView';
    return this.isEdit ? 'productos.form.titleEdit' : 'productos.form.titleAdd';
  }

  ngOnInit(): void {
    // Regenera la vista previa de códigos cada vez que cambia el artículo (auto-gen, manual o carga).
    this.form.controls.articulo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.generarCodigos(value ?? ''));

    this.service.obtenerLineas().subscribe((l) => this.lineas.set(l));
    this.service.obtenerUnidadesMedida().subscribe((u) => this.unidadesMedida.set(u));
    this.service.obtenerUnidadesCompra().subscribe((u) => this.unidadesCompra.set(u));

    const p = this.data?.producto;
    if (p) {
      this.form.patchValue({
        descripcion: p.descripcion,
        articulo: p.articulo,
        codigoBarras: p.codigoBarras,
        idLineaProducto: p.idLineaProducto,
        claveProdServ: p.claveProdServ,
        idUnidadMedida: p.idUnidadMedida,
        cantidadUnidadMedida: p.cantidadUnidadMedida,
        idUnidadCompra: p.idUnidadCompra,
        cantidadUnidadCompra: p.cantidadUnidadCompra,
      });
      // Siembra la clave SAT actual con su descripción (búsqueda por la clave exacta) para que
      // el selector paginado la muestre seleccionada con etiqueta legible.
      if (p.claveProdServ) {
        this.claveSatPreload.set([new ClaveSatModel({ claveProdServ: p.claveProdServ })]);
        this.service.buscarClavesSat(p.claveProdServ, 1).subscribe((items) => {
          const match = items.find((c) => c.claveProdServ === p.claveProdServ);
          if (match) this.claveSatPreload.set([match]);
        });
      }
    }

    if (this.readonly) {
      this.form.disable();
    }
  }

  /**
   * Auto-genera el artículo desde Línea + Descripción, como el legado (EvtProductos.js):
   * articulo = (texto de la línea sin "Linea ", 2 primeros chars) + "-" + (descripción, 3 primeros chars),
   * todo en MAYÚSCULAS. Se dispara al teclear la descripción (si hay línea) y al cambiar la línea
   * (si hay descripción).
   */
  onDescripcionInput(): void {
    if (this.form.controls.idLineaProducto.value != null) this.generarArticulo();
  }

  onLineaChange(): void {
    if ((this.form.controls.descripcion.value ?? '') !== '') this.generarArticulo();
  }

  private generarArticulo(): void {
    const lineaSel = this.lineas().find((l) => l.id === this.form.controls.idLineaProducto.value);
    const lineaTxt = (lineaSel?.descripcion ?? '').replace('Linea ', '').substring(0, 2);
    const desc = (this.form.controls.descripcion.value ?? '').substring(0, 3);
    this.form.controls.articulo.setValue((lineaTxt + '-' + desc).toUpperCase());
  }

  /**
   * Genera la vista previa de Código de Barras (Code128) + QR a partir del artículo, en el front
   * (legado: AJAX a /Productos/ObtenerCodigos con ZXing). Si el artículo está vacío, limpia ambos.
   */
  private generarCodigos(articulo: string): void {
    const txt = (articulo ?? '').trim();
    if (!txt) {
      this.barcodeUrl.set(null);
      this.qrUrl.set(null);
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, txt, { format: 'CODE128', height: 60, width: 2, displayValue: true, margin: 6 });
      this.barcodeUrl.set(canvas.toDataURL('image/png'));
    } catch {
      this.barcodeUrl.set(null);
    }
    QRCode.toDataURL(txt, { width: 140, margin: 1 })
      .then((url) => this.qrUrl.set(url))
      .catch(() => this.qrUrl.set(null));
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request = new GuardarProductoRequestModel({
      idProducto: this.data?.producto?.idProducto ?? 0,
      descripcion: raw.descripcion ?? '',
      articulo: raw.articulo ?? '',
      codigoBarras: raw.codigoBarras || null,
      idLineaProducto: raw.idLineaProducto ?? 0,
      claveProdServ: raw.claveProdServ ?? '',
      idUnidadMedida: raw.idUnidadMedida ?? 0,
      cantidadUnidadMedida: raw.cantidadUnidadMedida ?? 0,
      idUnidadCompra: raw.idUnidadCompra ?? null,
      cantidadUnidadCompra: raw.cantidadUnidadCompra ?? null,
      activo: this.data?.producto?.activo ?? true,
    });

    const peticion$ = this.isEdit
      ? this.service.actualizar(request.idProducto, request)
      : this.service.crear(request);

    this.saving.set(true);
    peticion$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (res) => {
        if (res?.estatus === 200) {
          this.notify.notify('success', res.mensaje ?? '');
          this.dialogRef.close(
            new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, message: res.mensaje }),
          );
        } else {
          this.notify.notify(
            'error',
            res?.mensaje ?? this.translate.instant('productos.msg.saveFallback'),
          );
        }
      },
      error: (err) => {
        console.error('Error al guardar producto', err);
        this.notify.notify('error', this.translate.instant('productos.msg.saveError'));
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
