---
name: origen-proyecto
description: De dónde sale el proyecto y por qué el naming es inconsistente
type: project
---

Este frontend parte de la plantilla comercial **Modernize Angular Admin** (Angular 17),
comprada con muchos componentes ya estilizados. El proyecto se **copió de otro**
(BodyBooster); el producto real es **Comercializadora Lluvia** y se desarrollará en
`src/app/admin/`. Las páginas bajo `src/app/pages/` son demos de la plantilla, no producto.

**Limpieza hecha (2026-06-19):** se eliminó todo el dominio BodyBooster
(`feature/`, `services/`, `models/`, `shared/` de la antigua `bb-admin`) y se renombró
`bb-admin` → `admin`, dejando solo el esqueleto (módulo + routing + shell). Se ajustaron
`app-routing.module.ts`, `navItemsApp` (sidebar) y el redirect de `athlete-login`.

**Naming heredado que aún queda:** "evaluaciones" (ej. `src/app/config/uris-config.ts`,
`build:iis` con base-href `/front-evaluaciones/`, archivo `sidebar-evaluaciones-data.ts`)
y el logo `assets/images/logos/bodybooster.png` (referenciado en `branding.component.ts`
y `athlete-login.component.html`). No asumas que todo el naming refleja el dominio actual.
Pendiente de rebranding del logo y de las URLs ([[pendiente-urls-backend]]).

Repo: `varCloud/comercializadora-front`, dentro del proyecto `lluvia-migracion`.
