# Regla 20 — Tabs: estilo delgado con subrayado, siempre global

> ⚠️ **REGLA DURA.** Todo `mat-tab-group` y todo `mat-button-toggle-group` usado como selector
> de modo/tabs se ve con el estilo **delgado + subrayado** definido **globalmente** en
> `src/assets/scss/style.scss`. **Prohibido** reimplementar o sobrescribir este look por
> componente (`:host ::ng-deep` local, `styles` inline, etc.).

## Qué cambia respecto al default de Angular Material

- Sin fondo tipo "pill"/segmented-control ni bordes entre opciones.
- Sin el checkmark de selección de `mat-button-toggle`.
- Una línea inferior delgada (1px) recorre todo el grupo; la opción activa se marca con un
  subrayado de 2px en el color primario y texto en negrita.
- Tipografía más compacta (14px) que el default de Material.

## Dónde vive (no duplicar)

El estilo está centralizado en `src/assets/scss/style.scss` (bloque "Tabs (mat-tab-group /
mat-button-toggle-group)"). Cubre:

- **`mat-tab-group`**: `.mat-mdc-tab-header`, `.mdc-tab`, `.mdc-tab__text-label`,
  `.mdc-tab-indicator__content--underline`.
- **`mat-button-toggle-group`** usado como selector de modo (ej. Venta/Devolución/Complemento
  del POS): `.mat-button-toggle-group`, `.mat-button-toggle`, `.mat-button-toggle-label-content`,
  `.mat-button-toggle-checkbox-wrapper` (oculto), `.mat-button-toggle-checked`.

## Cómo aplicar

- Usa `<mat-tab-group>`/`<mat-tab>` o `<mat-button-toggle-group>`/`<mat-button-toggle>` tal cual
  los provee Angular Material — el look ya sale correcto sin tocar nada en el componente.
- **No** agregues SCSS local para tabs (ni `:host ::ng-deep`, ni `styles:` inline). Si el estilo
  global no calza en un caso puntual, ajusta el bloque global en `style.scss`, no lo dupliques
  por componente.
- Si `mat-button-toggle-group` se usa en modo **multi-selección real** (no como selector de
  modo/tabs), revisa si ocultar el checkbox de selección (`.mat-button-toggle-checkbox-wrapper`)
  sigue teniendo sentido para ese caso antes de reusarlo tal cual.

## Por qué

El usuario pidió que el estilo de tabs (visto primero en un diálogo con `mat-tab-group` y luego
en el selector Venta/Devolución/Complemento del POS, un `mat-button-toggle-group`) sea
**consistente en todo el sistema**, no una excepción de un componente. Centralizarlo en
`style.scss` asegura que cualquier tab/selector de modo nuevo salga con el mismo look sin que
cada pantalla lo reimplemente.

Complementa: regla 01 (CSS mínimo / estilos globales reutilizables).
