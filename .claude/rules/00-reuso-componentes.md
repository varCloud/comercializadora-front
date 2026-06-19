# Regla 00 — Reutilizar antes de crear

**Antes de crear cualquier componente, pipe, helper o servicio, busca si ya existe
uno que resuelva lo que necesitas. NO dupliques.**

## Dónde buscar

- Componentes compartidos: `src/app/bb-admin/shared/components/`
  (`chip-group`, `back-button`, `asset-player`, `workout-list`, `workout-filter-modal`,
  `update-user-button`, `modal-status-history`, `user-status-history-list`,
  `view-status-history-button`, `moda-delete-user`). Varios se reexportan desde
  `shared/components/index.ts`.
- Card de usuario reutilizable: `src/app/components/card-info-usuario/`.
- Pipes: `src/app/bb-admin/shared/pipes/` (ej. `date-format.pipe.ts`).
- Helpers: `src/app/bb-admin/shared/helpers/` (ej. `status-color.helper.ts`).
- Funciones: `src/app/bb-admin/shared/functions/` (ej. `eventPaginator.ts`).
- UI genérica (botones, tablas, diálogos, inputs, selects): **Angular Material** y
  `@ng-matero/extensions`, `@ng-select/ng-select`. No reinventes.

## Cómo aplicar

- Si un componente compartido casi sirve, **extiéndelo con `@Input()`/`@Output()`**
  en lugar de crear uno nuevo.
- Si vas a crear algo que probablemente se reutilice, ponlo en `shared/` y reexpórtalo
  desde `shared/components/index.ts`.
- Lógica repetida (paginación, formato de fecha, colores de estado) → usa las
  funciones/helpers existentes, no la reescribas inline.
