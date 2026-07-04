# PENDIENTE: listados con SCSS inline incumplen la regla 01 (`styles:` en el decorador)

**Tipo:** gotcha / pendiente

Varios listados tienen el fix de la columna `stickyEnd` (regla 10) **inline** en el decorador
`@Component` (`styles: [...]`), lo cual incumple la regla dura **01-css-minimo.md** ("el SCSS
va SIEMPRE en su propio archivo, nunca inline en el TS"). El anti-patrón se propaga porque
cada módulo nuevo copia el listado del módulo anterior como plantilla.

**Descubierto:** durante la migración de `relacion_trapeadores` (solo relacion-liquidos);
en la revisión del módulo `clientes` (2026-07-03) se confirmó con grep que el desajuste es
**recurrente**. Estado actual:

- ✅ **Cumplen** (`styleUrl` + `.scss` propio): `relacion-trapeadores-list`,
  `clientes-list` y `tipos-cliente-list` (corregidos por revisor-frontend en la feature
  `clientes`).
- ❌ **Pendientes de mover `styles: [...]` a su `.scss`:** `relacion-liquidos-list`,
  `compras-list`, `productos-list`, `proveedores-list`, `estaciones-list`, `usuarios-list`
  (todos en `src/app/admin/feature/<x>/pages/<x>-list/`).

**Pendiente:** en una sesión de limpieza, mover el bloque `styles: [...]` de los 6 listados
restantes a un `.scss` propio con `styleUrl`. Al migrar módulos nuevos, **no copiar** el
`styles:` inline del módulo plantilla: crear el `.scss` desde el inicio (ejemplo correcto:
`clientes-list.component.scss`).
