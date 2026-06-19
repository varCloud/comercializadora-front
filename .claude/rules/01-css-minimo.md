# Regla 01 — Generar el mínimo CSS posible

**Por defecto, un componente nuevo NO necesita SCSS propio.** Varios compartidos
(`chip-group`, `back-button`) no tienen archivo `.scss`. Apunta a eso.

## Usa utilidades globales en vez de escribir CSS

La plantilla ya incluye un sistema de clases utilitarias tipo Bootstrap. Úsalas:

- Layout: `d-flex`, `align-items-center`, `justify-content-between`, `gap-*`, `flex-1-auto`.
- Espaciado: `m-*`, `mt-*`, `mb-*`, `p-*`, `px-*`, `py-*`.
- Texto: `text-*`. Bordes/redondeo: `border-*`, `rounded-*`.

Definidas en `src/assets/scss/helpers/` (`_display`, `_flexbox`, `_spacing`, `_text`,
`_border`, `_rounded`) y `src/assets/scss/helpers/_custom-flex.scss`.

## Reutiliza estilos/temas existentes

- Estados: usa la clase global `.status-badge` con `.status-N` / `.status-<nombre>` y
  el `status-color.helper.ts`; no recrees estilos de estado.
- Colores: usa el **theming de Material** (variables de tema), no hex hardcodeado.

## Cuándo (y cómo) sí escribir SCSS

- Solo cuando las utilidades no alcancen. Manténlo **mínimo y local** al componente.
- Prohibido: `!important`, selectores globales desde un componente, estilos ad-hoc
  nuevos en `styles.scss` / `assets/scss/style.scss` (ahí solo van utilidades
  genuinamente reutilizables en toda la app).
