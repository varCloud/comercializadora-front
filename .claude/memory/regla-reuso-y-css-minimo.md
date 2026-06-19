---
name: regla-reuso-y-css-minimo
description: Regla de equipo - reutilizar componentes y generar el mínimo CSS
type: decision
---

**Regla obligatoria** al crear tareas, componentes, páginas o features:

1. **Reutilizar antes de crear.** Usar Angular Material + `@ng-matero/extensions`
   para UI genérica y las páginas demo de la plantilla (`src/app/pages/`) como
   referencia. Lo reutilizable que vayas creando ponlo en `src/app/admin/shared/`
   y reexpórtalo. Si un componente compartido casi sirve, extenderlo con
   `@Input()/@Output()`, no duplicarlo. (Nota: la antigua librería de bb-admin se
   eliminó; hoy `admin/` es un scaffold vacío — ver [[origen-proyecto]].)

2. **Mínimo CSS.** Por defecto un componente nuevo NO lleva SCSS propio. Usar las
   clases utilitarias globales tipo Bootstrap ya incluidas (`d-flex`, `m-*`, `p-*`,
   `text-*`, `rounded-*`, `border-*`, `gap-*`) definidas en `src/assets/scss/helpers/`.
   Reutilizar clases globales como `.status-badge`/`.status-N`. Usar theming de
   Material en vez de colores hardcodeados. Escribir SCSS de componente solo si las
   utilidades no alcanzan; sin `!important` ni selectores globales. No agregar estilos
   globales ad-hoc en `styles.scss`/`style.scss`.

3. **Seguir el patrón existente** (standalone + `loadComponent`
   en `admin` — ver [[arquitectura-mixta]]).

**Por qué:** mantener el CSS chico y reutilizar evita inconsistencias visuales,
reduce el bundle y acelera el desarrollo aprovechando la plantilla comprada
([[origen-proyecto]]). Reglas formales en `.claude/rules/` (`00-reuso-componentes.md`,
`01-css-minimo.md`); este archivo es el resumen en memoria.
