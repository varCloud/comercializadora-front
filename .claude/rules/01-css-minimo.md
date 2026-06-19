# Regla 01 — Generar el mínimo CSS posible

**Por defecto, un componente nuevo NO necesita SCSS propio.** Resuelve el layout con
las utilidades globales y deja el `.scss` vacío (o sin `styleUrl`). El shell
`admin.component` sigue esta idea.

## Usa utilidades globales en vez de escribir CSS

La plantilla ya incluye un sistema de clases utilitarias tipo Bootstrap. Úsalas:

- Layout: `d-flex`, `align-items-center`, `justify-content-between`, `gap-*`, `flex-1-auto`.
- Espaciado: `m-*`, `mt-*`, `mb-*`, `p-*`, `px-*`, `py-*`.
- Texto: `text-*`. Bordes/redondeo: `border-*`, `rounded-*`.

Definidas en `src/assets/scss/helpers/` (`_display`, `_flexbox`, `_spacing`, `_text`,
`_border`, `_rounded`) y `src/assets/scss/helpers/_custom-flex.scss`.

## Reutiliza estilos/temas existentes

- Estados: existe la clase global `.status-badge` con `.status-N` / `.status-<nombre>`
  (en `assets/scss/style.scss`); reúsala en vez de recrear estilos de estado.
- Colores: usa el **theming de Material** (`color="primary"`/`"accent"`) y las clases
  `.text-*` / `.bg-*`, **nunca hex hardcodeado**. El color de marca es `#a6ce3a` (verde
  Lluvia) y está centralizado en `_variables.scss` y `themecolors/_default_theme.scss`
  (ver memoria `paleta-marca`). Si cambia la marca, se ajusta ahí, no por componente.

## Cuándo (y cómo) sí escribir SCSS

- Solo cuando las utilidades no alcancen. Manténlo **mínimo y local** al componente.
- Prohibido: `!important`, selectores globales desde un componente, estilos ad-hoc
  nuevos en `styles.scss` / `assets/scss/style.scss` (ahí solo van utilidades
  genuinamente reutilizables en toda la app).
