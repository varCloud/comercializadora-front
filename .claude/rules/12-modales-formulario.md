# Regla 12 — Modales y formularios

Los **formularios** (en modal o en página) se basan en la demo `pages/forms/form-vertical`.
Es el patrón de referencia para que los campos quepan y se vean consistentes.

## ⚠️ REGLA DURA — todo formulario reactivo se arma con `this.fb.group` y nombre descriptivo

- **Construcción:** todo formulario se define con **`this.fb.group({ … })`** (Reactive Forms,
  inyecta `FormBuilder` con `inject(FormBuilder)`). No uses `new FormGroup(...)` a mano.
- **Nombre del grupo:** la propiedad **describe lo que hace el formulario**, no `form` a secas.
  Patrón: `<entidad>Form` / `<acción>Form` (ej. `productoForm`, `clienteForm`, `loginForm`,
  `filtrosBusquedaForm`). En el template enlaza `[formGroup]="productoForm"`.

```ts
readonly productoForm = this.fb.group({
  descripcion: ['', Validators.required],
  idLineaProducto: [null as number | null, Validators.required],
  // …
});
```

> Si una pantalla tiene **varios** formularios, los nombres descriptivos los desambiguan
> (`filtrosForm` + `altaForm`), cosa imposible con `form`.

## Layout (vertical, label arriba)

- Cada campo es un bloque: **label arriba, control abajo**.
  - Label: `<mat-label class="mat-subtitle-2 f-w-600 d-block m-b-8">…</mat-label>`.
  - Control: `<mat-form-field appearance="outline" class="w-100">`.
- Agrupa con la grilla. **Patrón canónico de `row`/`col`** (ver `producto-form-dialog`):
  - El `<form>` es un **`row`**; dentro, un único contenedor **`col-12`**; dentro de él, un
    **`row`** que contiene los campos.
  - **Cada campo es una columna `col-sm-6`** (dos por fila desde el breakpoint `sm`; apilados a
    una columna en móvil). Usa **`col-12`** para un campo que deba ocupar el ancho completo.
  - **No** mezcles `col-sm-6 col-lg-6` (redundante: `col-sm-6` ya aplica de `sm` hacia arriba) ni
    dejes columnas sin breakpoint base.
  - **Ritmo vertical uniforme:** cada columna de campo lleva **`m-b-16`** (los `ng-select` /
    `app-select-paginado` no tienen el subscript de `mat-form-field`, así que sin `m-b-16` quedan
    desalineados respecto a los `mat-form-field`).

```html
<form [formGroup]="productoForm" class="row m-t-8">
  <div class="col-12">
    <div class="row">
      <div class="col-sm-6 m-b-16"> <!-- campo 1 (mat-form-field) --> </div>
      <div class="col-sm-6 m-b-16"> <!-- campo 2 (ng-select) --> </div>
      <div class="col-12 m-b-16">   <!-- campo ancho --> </div>
    </div>
  </div>
</form>
```

- Iconos opcionales con `<mat-icon matPrefix class="op-5"><i-tabler name="…" class="icon-20 d-flex"></i-tabler></mat-icon>`.
- Toggle de contraseña con `mat-icon-button matSuffix` + `i-tabler` (`eye` / `eye-off`).

## En diálogos (`MatDialog`)

- Estructura: `<h2 mat-dialog-title>`, `<mat-dialog-content class="b-t-1">`,
  `<mat-dialog-actions align="end">`.
- **Dimensiona el diálogo** para que el formulario quepa: al abrir, pasa `width` (p. ej.
  `'800px'`) y `maxWidth: '95vw'`. El contenido largo hace scroll dentro de `mat-dialog-content`.
- El diálogo devuelve un `ResultModalModel` con `ENUM_ESTATUS_MODAL` (regla 04); el que abre
  reacciona en `afterClosed()` (recargar lista si `status === OK`).

Complementa: reglas 04 (loading/avisos), 08 (signals/control flow), 03 (idioma).
