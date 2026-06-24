---
name: modulo-usuarios
description: Feature Usuarios (primer módulo de producto) y convenciones de listados/modelos que estableció
type: project
---

# Módulo Usuarios (feature de producto)

Primer módulo real bajo `admin/feature/usuarios/` (2026-06-20). Consume la API nueva
`api/usuarios`. Estructura:
- `pages/usuarios-list/` — listado (tabla + buscador + paginador server-side).
- `components/usuario-form-dialog/` — modal alta/edición (combo Sucursal→Almacén dependiente).
- `services/usuarios.service.ts` — HTTP del dominio.
- Modelos en `admin/models/usuarios/` + genéricos en `admin/models/shared/`.
- Ruta `usuarios` en `admin-routing.module.ts`; entrada **Usuarios** en `navItemsApp`.

## Convenciones que fijó (reglas nuevas)
- **10-tablas-listados:** listados al estilo `pages/datatable/kichen-sink`; acciones con
  iconos `i-tabler` (no texto); `MaterialModule` + `TablerIconsModule` en standalone.
- **11-modelos-feature:** modelos en `admin/models/<feature>/`, **un archivo = una interfaz +
  su modelo**; genéricos en `admin/models/shared/`.
- **12-modales-formulario:** formularios al estilo `pages/forms/form-vertical`; dimensionar el
  diálogo (`width`/`maxWidth`) para que quepa.
- **13-busqueda-listados:** todo listado lleva buscador → front input con debounce + back query
  param `search`.
- **14-i18n-traducciones:** texto de UI con claves `USUARIOS.*` y descripción en `en.json`/
  `es.json`; `TranslatePipe` en plantillas y `TranslateService.instant` en TS.

## Paginación
Server-side con `mat-paginator`; la API espera `pageNumber` 1-based (`pageIndex + 1`), `pageSize`,
`search`. Tamaños desde `CONSTANTS.PAGINATION`.

Relacionado: [[login-jwt-migrado]], [[arquitectura-mixta]].
