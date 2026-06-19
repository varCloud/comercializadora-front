# Regla 06 — Arquitectura al crear pantallas

Arquitectura **mixta** (ver memoria `arquitectura-mixta.md`):

- La raíz de la app y la plantilla usan **NgModules** con lazy loading (`loadChildren`).
- El feature de producto **`bb-admin`** usa **componentes standalone** cargados con
  `loadComponent` desde su `*-routing.module.ts`.

## Al crear una pantalla nueva en bb-admin

- Hazla **componente standalone** (`standalone: true`) con sus propios `imports`
  (Material, Tabler, BlockUIModule, componentes compartidos, etc.).
- Cárgala con `loadComponent` en el routing del dominio; agrega `data: { title: '...' }`.
- **No** crees NgModules nuevos dentro de bb-admin.
- Imita la estructura del feature vecino:
  `feature/<dominio>/pages/<page>/` para páginas, `components/` para piezas locales,
  `*-routing.module.ts` para las rutas del dominio.
- Lógica/UI reutilizable → `bb-admin/shared/` (ver regla 00), no dentro de una página.
