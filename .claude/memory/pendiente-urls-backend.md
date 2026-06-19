---
name: pendiente-urls-backend
description: PENDIENTE - apuntar los environments al nuevo backend comercializadora-lluvia
type: project
---

**Pendiente (al 2026-06-19):** los archivos de entorno apuntan al backend viejo
heredado de la plantilla y son inconsistentes. Hay que repuntarlos al nuevo backend,
cuyo nombre es **`comercializadora-lluvia`** (el proyecto se copió/pegó de otro).

El usuario **aún no tiene las URLs**; actualizar cuando las proporcione.

Estado actual de `src/environments/`:
- `environment.ts` (dev): `BASE_URL` y `BASE_URL_ADMIN` → `api.bodybooster.com.mx`.
- `environment.prod.ts`: `PRODUCTION: true`, `BASE_URL` →
  `evaluaciones-desempenio-api.onrender.com` (heredado de "evaluaciones",
  ver [[origen-proyecto]]), `BASE_URL_ADMIN` → `bb-api-y0vm.onrender.com`.
- `environment.iis.prod.ts`: revisar también.

**Al tener las URLs, falta definir:** URL base nueva (¿Render u dominio propio?),
si conserva la estructura de rutas (`/api/v1` público, `/api/admin/v1` admin), y si se
cambian los tres archivos o solo prod. Dejar los tres consistentes.
