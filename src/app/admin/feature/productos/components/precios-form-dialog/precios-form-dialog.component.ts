import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { Producto } from 'src/app/admin/models/productos/producto';
import { RangoPrecioInput } from 'src/app/admin/models/productos/guardar-precios-request';
import { GuardarPreciosRequestModel } from 'src/app/admin/models/productos/guardar-precios-request';
import { ProductosService } from 'src/app/admin/services/productos.service';

/** Datos que recibe el diálogo: el producto cuyas claves de precio se editan. */
export interface PreciosFormData {
  producto: Producto;
}

/**
 * Modal de precios por producto — migración 1:1 del modal legado "Rangos de Precios"
 * (Views/Productos/Productos.cshtml + js/EvtProductos.js).
 *
 * Etiquetas del legado (los nombres de campo son los de la BD, las etiquetas se invierten):
 *   precioIndividual       = "Precio Menudeo"
 *   precioMenudeo          = "Precio Mayoreo"
 *   porcUtilidadIndividual = "% Utilidad Menudeo"
 *   porcUtilidadMayoreo    = "% Utilidad Mayoreo"
 *
 * Reactividad precio ⇄ % utilidad (vía último costo) replicada de los keyup del legado.
 */
@Component({
  selector: 'app-precios-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, TranslatePipe, BlockUIModule, CurrencyPipe, DecimalPipe],
  templateUrl: './precios-form-dialog.component.html',
})
export class PreciosFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProductosService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<PreciosFormDialogComponent>);
  readonly data = inject<PreciosFormData>(MAT_DIALOG_DATA);

  @BlockUI('precios') blockUI!: NgBlockUI;

  readonly saving = signal(false);
  readonly rangos = signal<RangoPrecioInput[]>([]);
  readonly rangosCols = ['idx', 'min', 'max', 'costo', 'porcUtilidad', 'action'];

  /** % de utilidad cargados de origen; se restauran si el usuario teclea un valor ≤ 0 (como el legado). */
  private porcUtilidadIndividualOriginal = 0;
  private porcUtilidadMayoreoOriginal = 0;

  /** Precios base. Orden y etiquetas como el modal legado. */
  readonly form = this.fb.group({
    ultimoCostoCompra: [0],
    porcUtilidadMayoreo: [0],
    precioMenudeo: [0], // Precio Mayoreo
    porcUtilidadIndividual: [0],
    precioIndividual: [0], // Precio Menudeo
  });

  /** Form para agregar un rango de "super mayoreo". */
  readonly rangoForm = this.fb.group({
    min: [null as number | null],
    max: [null as number | null],
    porcUtilidad: [null as number | null],
    precio: [null as number | null],
  });

  ngOnInit(): void {
    this.blockUI.start(this.translate.instant('productos.precios.loading'));
    this.service
      .obtenerPrecios(this.data.producto.idProducto)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (p) => {
          const costo = p.ultimoCostoCompra ?? 0;
          const precioIndividual = p.precioIndividual ?? 0;
          const precioMenudeo = p.precioMenudeo ?? 0;

          // Si no viene % utilidad pero sí costo y precio, se calcula (legado: ObtenerIndividualMenudeo).
          let porcUtilidadIndividual = p.porcUtilidadIndividual ?? 0;
          if (porcUtilidadIndividual === 0 && costo > 0 && precioIndividual > 0) {
            porcUtilidadIndividual = this.calcPorcUtilidad(costo, precioIndividual);
          }
          let porcUtilidadMayoreo = p.porcUtilidadMayoreo ?? 0;
          if (porcUtilidadMayoreo === 0 && costo > 0 && precioMenudeo > 0) {
            porcUtilidadMayoreo = this.calcPorcUtilidad(costo, precioMenudeo);
          }

          this.porcUtilidadIndividualOriginal = porcUtilidadIndividual;
          this.porcUtilidadMayoreoOriginal = porcUtilidadMayoreo;

          this.form.patchValue({
            ultimoCostoCompra: costo,
            porcUtilidadMayoreo,
            precioMenudeo,
            porcUtilidadIndividual,
            precioIndividual,
          });

          // Rangos: calcula % utilidad si no viene y hay costo base (legado: pintarPrecios).
          this.rangos.set(
            p.rangos.map((r) => {
              let porcUtilidad = r.porcUtilidad ?? 0;
              if (r.costo > 0 && porcUtilidad === 0 && costo > 0) {
                porcUtilidad = this.calcPorcUtilidad(costo, r.costo);
              }
              return { min: r.min, max: r.max, costo: r.costo, porcUtilidad };
            }),
          );
        },
        error: (err) => {
          console.error('Error al cargar precios', err);
          this.notify.notify('error', this.translate.instant('productos.precios.loadError'));
        },
      });
  }

  // ── Cálculos (migrados 1:1 de EvtProductos.js) ──────────────────────────────

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  /** % utilidad = (precio*100/costo) - 100, redondeado a 2. 0 si falta costo o precio. */
  private calcPorcUtilidad(costo: number, precio: number): number {
    if (costo > 0 && precio > 0) return this.round2((precio * 100) / costo - 100);
    return 0;
  }

  /** precio = costo * (1 + utilidad/100), redondeado a 2. 0 si falta costo o utilidad. */
  private calcPrecioPorUtilidad(costo: number, utilidad: number): number {
    if (costo > 0 && utilidad > 0) return this.round2(costo * (1 + utilidad / 100));
    return 0;
  }

  private num(v: number | null | undefined): number {
    return typeof v === 'number' && !isNaN(v) ? v : 0;
  }

  private get costo(): number {
    return this.num(this.form.controls.ultimoCostoCompra.value);
  }

  // ── Reactividad de los campos base (keyup del legado) ───────────────────────

  /** Precio Menudeo → % Utilidad Menudeo. */
  onPrecioIndividualInput(): void {
    const v = this.calcPorcUtilidad(this.costo, this.num(this.form.controls.precioIndividual.value));
    this.form.controls.porcUtilidadIndividual.setValue(v, { emitEvent: false });
  }

  /** Precio Mayoreo → % Utilidad Mayoreo. */
  onPrecioMenudeoInput(): void {
    const v = this.calcPorcUtilidad(this.costo, this.num(this.form.controls.precioMenudeo.value));
    this.form.controls.porcUtilidadMayoreo.setValue(v, { emitEvent: false });
  }

  /** % Utilidad Menudeo → Precio Menudeo (si ≤ 0 restaura el original). */
  onPorcUtilidadIndividualInput(): void {
    let porc = this.num(this.form.controls.porcUtilidadIndividual.value);
    if (porc <= 0) {
      porc = this.porcUtilidadIndividualOriginal;
      this.form.controls.porcUtilidadIndividual.setValue(porc, { emitEvent: false });
    }
    this.form.controls.precioIndividual.setValue(this.calcPrecioPorUtilidad(this.costo, porc), { emitEvent: false });
  }

  /** % Utilidad Mayoreo → Precio Mayoreo (si ≤ 0 restaura el original). */
  onPorcUtilidadMayoreoInput(): void {
    let porc = this.num(this.form.controls.porcUtilidadMayoreo.value);
    if (porc <= 0) {
      porc = this.porcUtilidadMayoreoOriginal;
      this.form.controls.porcUtilidadMayoreo.setValue(porc, { emitEvent: false });
    }
    this.form.controls.precioMenudeo.setValue(this.calcPrecioPorUtilidad(this.costo, porc), { emitEvent: false });
  }

  /** Cambiar el último costo recalcula precios base (desde su %) y el precio de cada rango (desde su %). */
  onUltimoCostoInput(): void {
    const costo = this.costo;
    this.form.controls.precioIndividual.setValue(
      this.calcPrecioPorUtilidad(costo, this.num(this.form.controls.porcUtilidadIndividual.value)),
      { emitEvent: false },
    );
    this.form.controls.precioMenudeo.setValue(
      this.calcPrecioPorUtilidad(costo, this.num(this.form.controls.porcUtilidadMayoreo.value)),
      { emitEvent: false },
    );
    this.rangos.update((rs) => rs.map((r) => ({ ...r, costo: this.calcPrecioPorUtilidad(costo, r.porcUtilidad) })));
  }

  // ── Reactividad del rango de super mayoreo ──────────────────────────────────

  /** Precio del rango → % Utilidad del rango. */
  onPrecioRangoInput(): void {
    const v = this.calcPorcUtilidad(this.costo, this.num(this.rangoForm.controls.precio.value));
    this.rangoForm.controls.porcUtilidad.setValue(v, { emitEvent: false });
  }

  /** % Utilidad del rango → Precio del rango. */
  onPorcUtilidadRangoInput(): void {
    const v = this.calcPrecioPorUtilidad(this.costo, this.num(this.rangoForm.controls.porcUtilidad.value));
    this.rangoForm.controls.precio.setValue(v, { emitEvent: false });
  }

  // ── Alta de rango (btnAgregarPrecio del legado, validaciones 1:1) ───────────

  agregarRango(): void {
    const minRaw = this.rangoForm.controls.min.value;
    const maxRaw = this.rangoForm.controls.max.value;
    const precioRaw = this.rangoForm.controls.precio.value;

    // 1. Todos los datos requeridos (min, max, precio).
    if (minRaw == null || maxRaw == null || precioRaw == null) {
      this.notify.notify('warning', this.translate.instant('productos.precios.rangoDatosIncompletos'));
      return;
    }

    const min = this.num(minRaw);
    const max = this.num(maxRaw);
    const precio = this.num(precioRaw);
    const porcUtilidad = this.num(this.rangoForm.controls.porcUtilidad.value);
    const precioIndividual = this.num(this.form.controls.precioIndividual.value);
    const precioMenudeo = this.num(this.form.controls.precioMenudeo.value);

    // 2. Rangos de 1 a 5 → van en precio individual.
    if ((min >= 0 && min <= 5) || (max >= 0 && max <= 5)) {
      this.notify.notify('warning', this.translate.instant('productos.precios.rango1a5'));
      return;
    }
    // 3. Rango de 6 → va en precio menudeo.
    if (min === 6 || max === 6) {
      this.notify.notify('warning', this.translate.instant('productos.precios.rango6'));
      return;
    }
    // 4. El máximo debe ser mayor al mínimo.
    if (min >= max) {
      this.notify.notify('warning', this.translate.instant('productos.precios.rangoMaxMayorMin'));
      return;
    }

    // 5. Coherencia con los rangos ya capturados.
    let maximo = 0;
    let precioMinimo = 0;
    for (const r of this.rangos()) {
      if (r.max > maximo) maximo = r.max;
      if (precioMinimo === 0) precioMinimo = r.costo;
      if (r.costo < precioMinimo) precioMinimo = r.costo;
    }

    if (maximo >= min) {
      this.notify.notify('warning', this.translate.instant('productos.precios.rangoMinMayorAnterior'));
      return;
    }
    if (precioMinimo === 0 && (precio >= precioIndividual || precio >= precioMenudeo)) {
      this.notify.notify('warning', this.translate.instant('productos.precios.precioMenorBase'));
      return;
    }
    if (precioMinimo > 0 && precio >= precioMinimo) {
      this.notify.notify('warning', this.translate.instant('productos.precios.precioMenorAnterior'));
      return;
    }

    this.rangos.update((rs) => [...rs, { min, max, costo: precio, porcUtilidad }]);
    this.rangoForm.reset();
  }

  eliminarRango(index: number): void {
    this.rangos.update((rs) => rs.filter((_, i) => i !== index));
  }

  // ── Guardar (btnGuardarPrecios del legado, validaciones 1:1) ────────────────

  guardar(): void {
    const precioIndividual = this.num(this.form.controls.precioIndividual.value);
    const precioMenudeo = this.num(this.form.controls.precioMenudeo.value);

    // 1. Precios base requeridos.
    if (!precioIndividual || !precioMenudeo) {
      this.notify.notify('warning', this.translate.instant('productos.precios.saveBaseRequerido'));
      return;
    }
    // 2. Menudeo (individual) debe ser mayor o igual que Mayoreo (menudeo).
    if (precioIndividual < precioMenudeo) {
      this.notify.notify('warning', this.translate.instant('productos.precios.saveMenudeoMayorMayoreo'));
      return;
    }
    // 3. Cada rango debe ser menor que ambos precios base.
    let error = 0;
    for (const r of this.rangos()) {
      if (r.costo >= precioIndividual || r.costo >= precioMenudeo) {
        error++;
        this.notify.notify(
          'warning',
          this.translate.instant('productos.precios.saveRangoMenorBase', { min: r.min, max: r.max }),
        );
      }
    }
    if (error > 0) return;

    const request = new GuardarPreciosRequestModel({
      precioIndividual,
      precioMenudeo,
      ultimoCostoCompra: this.costo,
      porcUtilidadIndividual: this.num(this.form.controls.porcUtilidadIndividual.value),
      porcUtilidadMayoreo: this.num(this.form.controls.porcUtilidadMayoreo.value),
      rangos: this.rangos(),
    });

    this.saving.set(true);
    this.service
      .guardarPrecios(this.data.producto.idProducto, request)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify('success', res.mensaje ?? '');
            this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, message: res.mensaje }));
          } else {
            this.notify.notify('error', res?.mensaje ?? this.translate.instant('productos.precios.saveFallback'));
          }
        },
        error: (err) => {
          console.error('Error al guardar precios', err);
          this.notify.notify('error', this.translate.instant('productos.precios.saveError'));
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
