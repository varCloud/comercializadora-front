# Regla 17 — Apariencia de controles deshabilitados

> ⚠️ **REGLA DURA.** Todo input/select/control **deshabilitado** debe verse claramente
> deshabilitado: **fondo gris tenue** y **cursor `not-allowed`**. El estilo es **global y
> único**; no se reimplementa por componente.

## Dónde vive (no duplicar)

El estilo está centralizado en `src/assets/scss/style.scss` (bloque "Controles
deshabilitados"). Cubre:

- **Angular Material**: `.mat-mdc-form-field-disabled` (input, textarea, `mat-select`).
- **ng-select** (catálogos finitos y `app-select-paginado` en readonly): `.ng-select.ng-select-disabled`.
- **Controles nativos**: `input:disabled`, `select:disabled`, `textarea:disabled`.

Variable de fondo: `$disabled-bg: rgba(0, 0, 0, 0.04)` (gris tenue). Si hay que ajustar el
look deshabilitado, **se toca ahí**, no por componente.

## Cómo aplicar

- Para deshabilitar, usa el mecanismo de Reactive Forms: en la definición del control
  `{ value: …, disabled: true }`, o `control.disable()` / `form.disable()` (ej. modo readonly,
  ver `producto-form-dialog`). El estilo se aplica solo por las clases de estado.
- **No** agregues fondos/cursores de "deshabilitado" ad-hoc en el `.scss` de un componente: ya
  es global. Si un control no recibe el estilo, primero verifica que esté realmente `disabled`
  (no solo `readonly` visual).
- Recuerda (regla 15): un control `disabled` **no** aparece en `form.value`; recupera su valor
  con `form.getRawValue()` cuando deba enviarse al backend.

## Por qué

Un input deshabilitado que se ve igual que uno editable confunde (el usuario intenta escribir).
El fondo gris + `not-allowed` comunica el estado de forma consistente en toda la app, sin que
cada pantalla reinvente el estilo.

Complementa: reglas 01 (CSS mínimo / estilos globales reutilizables), 12 (formularios),
15 (selector de sucursal bloqueado), 16 (selectores).
