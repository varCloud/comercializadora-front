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

## ⚠️ Densidad de formularios y alturas de botón: GLOBALES

**La densidad de los campos se define una sola vez, en `assets/scss/style.scss`.** Ahí se aplica
`mat.form-field-density(-3)` + `mat.select-density(-3)` (campos de **44px** en lugar de los 56px
por defecto de Material, que desentonan con los botones). **Prohibido** volver a declarar densidad
en el SCSS de un componente (`:host { @include mat.form-field-density(...) }`) ni forzar alturas de
input a mano.

Para botones que comparten fila con un campo hay dos clases globales — úsalas, no reinventes
alturas:

- **`.btn-linea`** (44px) — botón pegado a un `mat-form-field` (buscar, agregar, filtrar…).
- **`.btn-accion`** (38px) — botón de la barra de acciones del encabezado de una card.

Si hace falta ajustar la densidad general, se toca **`style.scss`**, no la pantalla.

## Cuándo (y cómo) sí escribir SCSS

- Solo cuando las utilidades no alcancen. Manténlo **mínimo y local** al componente.
- Prohibido: `!important`, selectores globales desde un componente, estilos ad-hoc
  nuevos en `styles.scss` / `assets/scss/style.scss` (ahí solo van utilidades
  genuinamente reutilizables en toda la app).

## ⚠️ REGLA DURA — el SCSS va SIEMPRE en su propio archivo, nunca inline en el TS

**Cuando un componente necesite estilos, se generan en su archivo `.scss` y se enlazan con
`styleUrl` (o `styleUrls`). PROHIBIDO poner estilos en el decorador `@Component`** (`styles:
[...]` o `styles: \`...\``). El TS no contiene CSS.

```ts
// ✅ Correcto — estilos en archivo aparte
@Component({
  selector: 'app-x',
  templateUrl: './x.component.html',
  styleUrl: './x.component.scss',
})

// ❌ Prohibido — estilos embebidos en el TS
@Component({
  selector: 'app-x',
  templateUrl: './x.component.html',
  styles: [`.foo { color: red; }`],
})
```

- Si el componente **no** necesita estilos, no declares `styleUrl` y deja el `.scss` fuera
  (regla del CSS mínimo, arriba). Pero **si hay aunque sea una línea de SCSS, va en el `.scss`**.
- Aplica igual a estilos generados por scaffolding: muévelos al `.scss`, no los dejes en el TS.
