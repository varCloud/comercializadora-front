# Regla 00 — Reutilizar antes de crear

**Antes de crear cualquier componente, pipe, helper o servicio, busca si ya existe
uno que resuelva lo que necesitas. NO dupliques.**

> Estado actual: `src/app/admin/` es un scaffold vacío (se eliminó el dominio
> BodyBooster). Todavía **no hay** librería de componentes compartidos propia; se irá
> construyendo. Mientras tanto, apóyate en Angular Material y la plantilla.

## Dónde buscar / qué reutilizar

- **UI genérica** (botones, tablas, diálogos, inputs, selects, cards, paginador,
  tooltips): **Angular Material**, `@ng-matero/extensions`, `@ng-select/ng-select`.
  No reinventes estos componentes.
- **Páginas demo de la plantilla** (`src/app/pages/`, `src/app/components/`): úsalas
  como **referencia** de cómo se arma e estiliza un componente, pero NO son producto.
- **Lo que vayas creando y sea reutilizable** → ponlo en `src/app/admin/shared/`
  (componentes/pipes/helpers/funciones/modelos) y reexpórtalo desde un `index.ts`
  para que todo el feature lo consuma desde un solo punto.

## Cómo aplicar

- Si un componente compartido (cuando exista) casi sirve, **extiéndelo con
  `@Input()`/`@Output()`** en lugar de crear uno nuevo.
- Lógica repetida (paginación, formato de fecha, colores de estado) → créala una vez
  en `admin/shared/` y reúsala; no la copies inline en cada página.
- Antes de crear, busca en el repo (grep) por nombre/uso para no duplicar.
