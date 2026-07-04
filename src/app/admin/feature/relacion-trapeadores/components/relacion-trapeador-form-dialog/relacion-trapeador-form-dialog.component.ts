import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { ProductoModel } from 'src/app/admin/models/productos/producto';
import { ProductosService } from 'src/app/admin/services/productos.service';
import { RelacionTrapeador } from 'src/app/admin/models/relacion-trapeadores/relacion-trapeador';
import { GuardarRelacionTrapeadorRequestModel } from 'src/app/admin/models/relacion-trapeadores/guardar-relacion-trapeador-request';
import { RelacionTrapeadoresService } from 'src/app/admin/services/relacion-trapeadores.service';

/** Datos que recibe el diálogo al abrirse. */
export interface RelacionTrapeadorFormData {
  relacion?: RelacionTrapeador;
  readonly?: boolean;
}

/** Factor de conversión heredado del legado (captura en g/ml → almacena convertido). */
const CONVERSION_DE_UNIDADES = 1000;

@Component({
  selector: 'app-relacion-trapeador-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    TranslatePipe,
    NgSelectModule,
    SelectPaginadoComponent,
  ],
  templateUrl: './relacion-trapeador-form-dialog.component.html',
})
export class RelacionTrapeadorFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(RelacionTrapeadoresService);
  private readonly productosService = inject(ProductosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<RelacionTrapeadorFormDialogComponent>);
  readonly data = inject<RelacionTrapeadorFormData>(MAT_DIALOG_DATA);

  readonly unidadesMedida = signal<Catalogo[]>([]);
  readonly saving = signal(false);
  readonly isEdit = !!this.data?.relacion;
  readonly readonly = !!this.data?.readonly;

  // Estado para el convertidor (cantidad / 1000 con sufijo según la unidad seleccionada).
  private readonly cantidadRaw = signal<number | null>(null);
  private readonly idUnidadRaw = signal<number | null>(null);

  // Sufijo del convertidor: id 1 = Kg, id 2 = Gr; cualquier otro valor deja Kg como default.
  readonly convertido = computed(() => {
    const cantidad = this.cantidadRaw();
    const sufijo = this.idUnidadRaw() === 2 ? 'Gr' : 'Kg';
    const valor = cantidad != null && cantidad > 0 ? cantidad / CONVERSION_DE_UNIDADES : 0;
    return `${valor} (${sufijo})`;
  });

  // Items para sembrar la selección actual en edición/vista (para que el selector la muestre).
  readonly materia1Preload = signal<ProductoModel[]>([]);
  readonly materia2Preload = signal<ProductoModel[]>([]);
  readonly produccionPreload = signal<ProductoModel[]>([]);

  // fetchPage de cada selector paginado (regla 16); esta API no filtra productos por tipo, así
  // que los 3 selectores usan directo ProductosService.buscarPaginado.
  readonly fetchProductos = (q: string, page: number) => this.productosService.buscarPaginado(q, page);

  readonly relacionForm = this.fb.group({
    idProductoMateria1: [null as number | null, Validators.required],
    idProductoMateria2: [null as number | null, Validators.required],
    idProductoProduccion: [null as number | null, Validators.required],
    idUnidadMedidad: [null as number | null, Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.0001)]],
  });

  get titleKey(): string {
    if (this.readonly) return 'relacionTrapeadores.form.titleView';
    return this.isEdit ? 'relacionTrapeadores.form.titleEdit' : 'relacionTrapeadores.form.titleAdd';
  }

  ngOnInit(): void {
    this.service.obtenerUnidadesMedida().subscribe((u) => this.unidadesMedida.set(u));

    const r = this.data?.relacion;
    if (r) {
      // La cantidad mostrada se "desconvierte" (×1000) respecto a lo almacenado.
      const cantidad = (r.valorUnidadMedida ?? 0) * CONVERSION_DE_UNIDADES;
      this.relacionForm.patchValue({
        idProductoMateria1: r.idProductoMateria1,
        idProductoMateria2: r.idProductoMateria2,
        idProductoProduccion: r.idProductoProduccion,
        idUnidadMedidad: r.idUnidadMedidad,
        cantidad,
      });
      this.cantidadRaw.set(cantidad);
      this.idUnidadRaw.set(r.idUnidadMedidad);

      // Siembra cada selector con el producto seleccionado (id + descripción) para mostrarlo.
      this.materia1Preload.set([new ProductoModel({ idProducto: r.idProductoMateria1, descripcion: r.productoMateria1Descripcion })]);
      this.materia2Preload.set([new ProductoModel({ idProducto: r.idProductoMateria2, descripcion: r.productoMateria2Descripcion })]);
      this.produccionPreload.set([new ProductoModel({ idProducto: r.idProductoProduccion, descripcion: r.productoProduccionDescripcion })]);
    }

    if (this.readonly) {
      this.relacionForm.disable();
    }
  }

  onCantidadInput(value: string): void {
    const n = value === '' || value == null ? null : Number(value);
    this.cantidadRaw.set(Number.isFinite(n as number) ? (n as number) : null);
  }

  onUnidadChange(id: number | null): void {
    this.idUnidadRaw.set(id);
  }

  guardar(): void {
    if (this.relacionForm.invalid) {
      this.relacionForm.markAllAsTouched();
      return;
    }

    const raw = this.relacionForm.getRawValue();
    const request = new GuardarRelacionTrapeadorRequestModel({
      id: this.data?.relacion?.id ?? 0,
      idProductoMateria1: raw.idProductoMateria1 ?? 0,
      idProductoMateria2: raw.idProductoMateria2 ?? 0,
      idProductoProduccion: raw.idProductoProduccion ?? 0,
      idUnidadMedidad: raw.idUnidadMedidad ?? 0,
      // Se almacena el valor convertido (/1000), igual que Relación Líquidos.
      valorUnidadMedida: (raw.cantidad ?? 0) / CONVERSION_DE_UNIDADES,
    });

    const peticion$ = this.isEdit
      ? this.service.actualizar(request.id, request)
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
            res?.mensaje ?? this.translate.instant('relacionTrapeadores.msg.saveFallback'),
          );
        }
      },
      error: (err) => {
        console.error('Error al guardar la relación de trapeadores', err);
        this.notify.notify('error', this.translate.instant('relacionTrapeadores.msg.saveError'));
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
