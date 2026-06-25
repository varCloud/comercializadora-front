import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { Observable, finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { Producto, ProductoModel } from 'src/app/admin/models/productos/producto';
import { RelacionLiquido } from 'src/app/admin/models/relacion-liquidos/relacion-liquido';
import { GuardarRelacionLiquidoRequestModel } from 'src/app/admin/models/relacion-liquidos/guardar-relacion-liquido-request';
import { RelacionLiquidosService } from 'src/app/admin/services/relacion-liquidos.service';

/** Datos que recibe el diálogo al abrirse. */
export interface RelacionLiquidoFormData {
  relacion?: RelacionLiquido;
  readonly?: boolean;
}

/** Factor de conversión heredado del legado (captura en ml/g → almacena en L/K). */
const CONVERSION_DE_UNIDADES = 1000;

@Component({
  selector: 'app-relacion-liquido-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    TranslatePipe,
    NgSelectModule,
    SelectPaginadoComponent,
  ],
  templateUrl: './relacion-liquido-form-dialog.component.html',
})
export class RelacionLiquidoFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(RelacionLiquidosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<RelacionLiquidoFormDialogComponent>);
  readonly data = inject<RelacionLiquidoFormData>(MAT_DIALOG_DATA);

  readonly unidadesMedida = signal<Catalogo[]>([]);
  readonly saving = signal(false);
  readonly isEdit = !!this.data?.relacion;
  readonly readonly = !!this.data?.readonly;

  // Estado para el convertidor (cantidad / 1000 con sufijo según la unidad seleccionada).
  private readonly cantidadRaw = signal<number | null>(null);
  private readonly idUnidadRaw = signal<number | null>(null);

  // Sufijo del convertidor: id 2 = K (kg), cualquier otra = L (litros), igual que el legado.
  readonly convertido = computed(() => {
    const cantidad = this.cantidadRaw();
    const sufijo = this.idUnidadRaw() === 2 ? 'K' : 'L';
    const valor = cantidad != null && cantidad > 0 ? cantidad / CONVERSION_DE_UNIDADES : 0;
    return `${valor} (${sufijo})`;
  });

  // Items para sembrar la selección actual en edición/vista (para que el selector la muestre).
  readonly agranelPreload = signal<Producto[]>([]);
  readonly envasadoPreload = signal<Producto[]>([]);
  readonly envasePreload = signal<Producto[]>([]);

  // fetchPage de cada selector paginado (regla 16); el back filtra por tipo → líneas.
  readonly fetchGranel = (q: string, page: number): Observable<Producto[]> =>
    this.service.buscarProductos('granel', q, page);
  readonly fetchEnvasar = (q: string, page: number): Observable<Producto[]> =>
    this.service.buscarProductos('envasar', q, page);
  readonly fetchEnvase = (q: string, page: number): Observable<Producto[]> =>
    this.service.buscarProductos('envase', q, page);

  readonly form = this.fb.group({
    idProductoAgranel: [null as number | null, Validators.required],
    idProductoEnvasado: [null as number | null, Validators.required],
    idProducoEnvase: [null as number | null, Validators.required],
    idUnidadMedidad: [null as number | null, Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.0001)]],
  });

  get titleKey(): string {
    if (this.readonly) return 'relacionLiquidos.form.titleView';
    return this.isEdit ? 'relacionLiquidos.form.titleEdit' : 'relacionLiquidos.form.titleAdd';
  }

  ngOnInit(): void {
    this.service.obtenerUnidadesMedida().subscribe((u) => this.unidadesMedida.set(u));

    const r = this.data?.relacion;
    if (r) {
      // La cantidad mostrada se "desconvierte" (×1000) respecto a lo almacenado (legado).
      const cantidad = (r.valorUnidadMedida ?? 0) * CONVERSION_DE_UNIDADES;
      this.form.patchValue({
        idProductoAgranel: r.idProductoAgranel,
        idProductoEnvasado: r.idProductoEnvasado,
        idProducoEnvase: r.idProducoEnvase,
        idUnidadMedidad: r.idUnidadMedidad,
        cantidad,
      });
      this.cantidadRaw.set(cantidad);
      this.idUnidadRaw.set(r.idUnidadMedidad);

      // Siembra cada selector con el producto seleccionado (id + descripción) para mostrarlo.
      this.agranelPreload.set([new ProductoModel({ idProducto: r.idProductoAgranel, descripcion: r.agranelDescripcion })]);
      this.envasadoPreload.set([new ProductoModel({ idProducto: r.idProductoEnvasado, descripcion: r.envasadoDescripcion })]);
      this.envasePreload.set([new ProductoModel({ idProducto: r.idProducoEnvase, descripcion: r.envaseDescripcion })]);
    }

    if (this.readonly) {
      this.form.disable();
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request = new GuardarRelacionLiquidoRequestModel({
      idRelacionEnvasadoAgranel: this.data?.relacion?.idRelacionEnvasadoAgranel ?? 0,
      idProductoAgranel: raw.idProductoAgranel ?? 0,
      idProductoEnvasado: raw.idProductoEnvasado ?? 0,
      idProducoEnvase: raw.idProducoEnvase ?? 0,
      idUnidadMedidad: raw.idUnidadMedidad ?? 0,
      // Se almacena el valor convertido (/1000), igual que el legado.
      valorUnidadMedida: (raw.cantidad ?? 0) / CONVERSION_DE_UNIDADES,
    });

    const peticion$ = this.isEdit
      ? this.service.actualizar(request.idRelacionEnvasadoAgranel, request)
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
            res?.mensaje ?? this.translate.instant('relacionLiquidos.msg.saveFallback'),
          );
        }
      },
      error: (err) => {
        console.error('Error al guardar la relación de líquidos', err);
        this.notify.notify('error', this.translate.instant('relacionLiquidos.msg.saveError'));
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
