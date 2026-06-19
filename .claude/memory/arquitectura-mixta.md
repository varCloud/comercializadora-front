---
name: arquitectura-mixta
description: Cuándo usar NgModules vs componentes standalone
type: decision
---

La app usa una arquitectura **mixta** de Angular 17:

- La raíz (`app.module.ts`, `app-routing.module.ts`) y la plantilla usan **NgModules
  clásicos** con lazy loading vía `loadChildren`.
- El feature de producto `bb-admin` mantiene un `*-routing.module.ts` por dominio,
  pero las páginas son **componentes standalone** cargados con `loadComponent`.

**Cómo aplicar:** al crear pantallas nuevas dentro de `bb-admin`, hazlas componentes
standalone con sus propios `imports` y cárgalas con `loadComponent` desde el routing
del dominio. No introduzcas NgModules nuevos dentro de bb-admin.
