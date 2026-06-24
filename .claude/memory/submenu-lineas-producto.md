---
name: submenu-lineas-producto
description: Submenú "Líneas de producto" bajo Productos; primer uso de NavItem.children (grupo desplegable)
type: decision
---

Submenú **"Líneas de producto"** (CRUD del catálogo `LineaProducto`), colgado de Productos.

- **Menú (regla 07):** "Productos" en `navItemsApp` (`sidebar-evaluaciones-data.ts`) pasó de
  item plano a **grupo desplegable** con `children`: *Productos* (`/admin/productos`, icono `box`)
  + *Líneas de producto* (`/admin/productos/lineas`, icono `list`). Es el **primer uso de
  `NavItem.children`** en el menú de producto; el parent del grupo no lleva `route`.
- **Ruta:** hija `lineas` dentro de `productos-routing.module.ts` (standalone, `loadComponent`).
- **Estructura:** página `feature/productos/pages/lineas-list/` + modal
  `components/linea-form-dialog/` (un solo campo `descripcion`, `maxlength 50`); servicio
  `services/lineas-producto.service.ts`; modelos en `models/productos/`; i18n `lineasProducto.*`.
- Patrón idéntico al listado de Productos (Paginador + app-paginador, buscador debounce, acciones
  stickyEnd, table-stacked-mobile). SCSS sticky en archivo propio (regla 01).
- **API:** `api/lineas-producto` (módulo dedicado). Solo lista activas; la baja se bloquea si la
  línea tiene productos asociados. Ver `.claude/docs/feature/productos/salida_productos_lineas.md`.
