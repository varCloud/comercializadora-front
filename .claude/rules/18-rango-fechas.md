# Regla 18 — Rango de fechas: `mat-date-range-input`

> ⚠️ **REGLA DURA.** Todo filtro o formulario que tenga **fecha inicio + fecha fin** usa el
> control nativo de Angular Material **`mat-date-range-input`** (un solo `mat-form-field` con
> selector de calendario). **Prohibido** modelarlo como dos `<input matInput type="date">`
> sueltos (patrón heredado en `compras`, pendiente de migrar cuando se vuelva a tocar esa
> pantalla). `produccion-liquidos` **ya se migró** a este patrón; `produccion-trapeadores` nació
> directamente con él (primer módulo de referencia end-to-end).

## Patrón

Un **`FormGroup`** con `start`/`end` (o nombres descriptivos del filtro), un único
`mat-form-field appearance="outline" class="w-100 hide-hint"` con `mat-date-range-input` +
`matStartDate`/`matEndDate` + toggle + `mat-date-range-picker`:

```ts
readonly rangoFechasForm = this.fb.group({
  inicio: new FormControl<Date | null>(null),
  fin: new FormControl<Date | null>(null),
});

readonly hoy = new Date(); // límite superior: nunca excluye el día de hoy
```

```html
<mat-label class="mat-subtitle-2 f-w-600 d-block m-b-8">{{ 'feature.filters.rangoFechas' | translate }}</mat-label>
<mat-form-field appearance="outline" class="w-100 hide-hint">
  <mat-date-range-input [formGroup]="rangoFechasForm" [rangePicker]="picker" [max]="hoy">
    <input matStartDate formControlName="inicio" [placeholder]="'feature.filters.fechaInicio' | translate" />
    <input matEndDate formControlName="fin" [placeholder]="'feature.filters.fechaFin' | translate" />
  </mat-date-range-input>
  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
  <mat-date-range-picker #picker></mat-date-range-picker>
</mat-form-field>
```

> ⚠️ **`[rangePicker]` es obligatorio en `mat-date-range-input`.** Sin ese binding el input
> queda desconectado del `mat-date-range-picker` y el calendario **no abre** al hacer clic en el
> toggle (aunque `mat-datepicker-toggle` tenga su `[for]` apuntando al mismo picker). El `[for]`
> del toggle y el `[rangePicker]` del input deben apuntar **los dos** a la misma referencia
> (`#picker`).

- Al leer el valor para el request: `rangoFechasForm.value.inicio` / `.fin`. Al limpiar filtros:
  `rangoFechasForm.reset()` (igual que cualquier otro control del formulario, regla 12).

## Import obligatorio: `MatNativeDateModule`

`MaterialModule` (`src/app/material.module.ts`) ya exporta `MatDatepickerModule`, pero **no**
`MatNativeDateModule` (provee el `DateAdapter` nativo). En el componente **standalone** que use
`mat-date-range-input`, agrega explícitamente:

```ts
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  standalone: true,
  imports: [MaterialModule, MatNativeDateModule, /* ... */],
})
```

Sin este import, Angular lanza `Error: No provider found for DateAdapter` al abrir el picker.

## ⚠️ Hoy siempre debe quedar seleccionable (mínimo y máximo)

**El día de hoy nunca se deshabilita en el picker**, ni como límite inferior ni como superior:

- Si el filtro restringe fechas futuras (caso típico: reportes), usa **`[max]="hoy"`** —
  `hoy` **inclusive**, no `hoy - 1`. El usuario siempre puede elegir el día de hoy como fin de
  rango.
- **No** fijes un `[min]` que dependa de "hoy menos X días" de forma que excluya el propio día de
  hoy (ej. no uses `min` = mañana, ni cualquier cálculo que deje a hoy fuera del rango
  seleccionable).
- Si la pantalla no necesita límites, **no** pongas `[min]`/`[max]` — el usuario navega
  libremente por el calendario.

## CSS: ajusta lo necesario para que calce con la plantilla

`mat-date-range-input` no siempre hereda el mismo alto/spacing que el resto de los
`mat-form-field appearance="outline"` de la plantilla Modernize (separador " – " entre inputs,
padding). Si el resultado visual desentona:

- Ajusta el **mínimo CSS necesario**, **local al componente** (regla 01: sin `!important`, sin
  tocar `style.scss` global salvo que el patrón se repita en 3+ pantallas — en ese caso
  céntralo ahí, no lo dupliques por componente).
- Prioriza igualar altura/padding de los inputs internos (`.mat-date-range-input-container`,
  `.mat-date-range-input-start-wrapper`, `.mat-date-range-input-end-wrapper`) al resto de los
  `mat-form-field` de la pantalla, no al revés.

## Por qué

Dos inputs `type="date"` sueltos (uno para inicio, otro para fin) no validan que
`fin >= inicio`, usan el date picker nativo del navegador (inconsistente entre Chrome/Edge/Firefox
y distinto al resto de la UI Material) y ocupan el doble de espacio. `mat-date-range-input` da
selector de calendario consistente con el resto de la app, valida el rango y cabe en una sola
columna del grid (regla 12).

Complementa: reglas 01 (CSS mínimo), 12 (formularios/`fb.group`), 08 (standalone imports).
