---
name: origen-proyecto
description: De dónde sale el proyecto y por qué el naming es inconsistente
type: project
---

Este frontend parte de la plantilla comercial **Modernize Angular Admin** (Angular 17),
comprada con muchos componentes ya estilizados. El producto real se desarrolla en
`src/app/bb-admin/` (plataforma BodyBooster). Las páginas bajo `src/app/pages/` son
demos de la plantilla, no producto.

**Por qué importa:** hay nomenclatura heredada de un proyecto anterior de "evaluaciones"
(ej. `src/app/config/uris-config.ts`, `build:iis` con base-href `/front-evaluaciones/`).
No asumas que todo el naming refleja el dominio actual (comercializadora / BodyBooster).

Repo: `varCloud/comercializadora-front`, dentro del proyecto `lluvia-migracion`.
