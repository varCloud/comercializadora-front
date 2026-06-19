# CLAUDE.md

Guía para Claude Code al trabajar en este repositorio. Lee este archivo al iniciar cada sesión.

## Qué es este proyecto

Panel de administración web (frontend) construido sobre la plantilla comercial
**Modernize Angular Admin** (Angular 17 + Angular Material). Sobre esa plantilla
se desarrolla el dominio propio bajo `src/app/bb-admin/` (plataforma **BodyBooster**:
atletas, creadores, workouts, finanzas y dashboard).

> La plantilla trae muchas páginas de demostración (en `src/app/pages/`) que NO
> forman parte del producto: sirven como referencia de componentes ya estilizados.
> El código de producto vive en `src/app/bb-admin/`.

- Repo GitHub: `varCloud/comercializadora-front`
- Parte del proyecto `lluvia-migracion`.

## Stack

- **Angular 17** (no standalone bootstrap; usa `app.module.ts` clásico).
- **Angular Material 17** + `@ng-matero/extensions`, `@ng-select/ng-select`.
- **SCSS** (estilo por defecto de componentes).
- Iconos: `angular-tabler-icons`. Gráficas: `apexcharts` / `ng-apexcharts`.
- Alertas: `sweetalert2` / `@sweetalert2/ngx-sweetalert2`.
- Otros: `ngx-permissions`, `ngx-pagination`, `ng-block-ui`, `@ngx-translate`, `xlsx`.
- TypeScript ~5.2, RxJS ~7.5.

## Comandos

```bash
npm start          # ng serve (configuración development) -> http://localhost:4200
npm run build      # build de producción
npm run build:iis  # build para IIS con base-href /front-evaluaciones/ + copy-to-iis.js
npm run watch       # build en watch (development)
npm test           # ng test (Karma + Jasmine)
```

## Arquitectura

Arquitectura **mixta** — respétala según la zona en la que trabajes:

- **Raíz de la app** (`app.module.ts`, `app-routing.module.ts`): NgModules clásicos
  con lazy loading vía `loadChildren`.
- **Feature `bb-admin`** (código de producto): cada feature tiene su
  `*-routing.module.ts`, pero las páginas son **componentes standalone** cargados
  con `loadComponent`. Al crear pantallas nuevas en `bb-admin`, sigue este patrón
  (componentes standalone con sus propios `imports`).

### Estructura de `src/app/bb-admin/`

- `feature/<dominio>/` — athlete, creator, workout, finance, dashboard.
  Cada uno: `*-routing.module.ts` + `pages/<page>/` (componente standalone) +
  `components/` locales.
- `services/` — servicios HTTP por dominio (`list-athletes.service.ts`,
  `creator-profile.service.ts`, `user.service.ts`, etc.).
- `shared/` — `components/`, `pipes/`, `enums/`, `models/`, `helpers/`, `functions/`
  reutilizables dentro de bb-admin.
- `models/` — modelos del dominio.

### Layouts y rutas

- `layouts/full/` — layout autenticado (sidebar + header). `layouts/blank/` — login/landing.
- Ruta raíz `''` redirige a `bb-admin`. Login en `login/authentication/side-login`.

## Autenticación y API

- Token JWT en `localStorage` bajo la clave `token`.
- `interceptors/auth.interceptor.ts` agrega `Authorization: Bearer <token>` a cada
  request; ante un **401** limpia el token y redirige a `login/authentication/side-login`.
- `guards/auth.guard.ts` protege rutas verificando la existencia del token.
- URLs base en `src/environments/`:
  - `environment.ts` (dev), `environment.prod.ts` (prod), `environment.iis.prod.ts` (IIS).
  - `BASE_URL` = API pública v1, `BASE_URL_ADMIN` = API admin. Apuntan a
    `api.bodybooster.com.mx`.
- Endpoints/segmentos centralizados en `src/app/config/uris-config.ts`.

> Nota: en `config/` y en `build:iis` hay nomenclatura heredada de "evaluaciones".
> La plantilla se está reutilizando; no asumas que todo el naming refleja el dominio actual.

## Reglas de desarrollo

Al crear o modificar componentes, páginas o features, sigue estas reglas en orden:

### 1. Reutiliza antes de crear

- **Primero busca** si ya existe un componente, pipe, helper o servicio que resuelva
  lo que necesitas. NO dupliques.
- Componentes compartidos: `src/app/bb-admin/shared/components/`
  (`chip-group`, `back-button`, `asset-player`, `workout-list`,
  `update-user-button`, `modal-status-history`, `user-status-history-list`,
  `view-status-history-button`, `moda-delete-user`, `workout-filter-modal`).
  Varios se reexportan desde `shared/components/index.ts`.
- Card de usuario reutilizable: `src/app/components/card-info-usuario/`.
- Pipes/helpers/funciones compartidas: `shared/pipes/` (`date-format.pipe.ts`),
  `shared/helpers/` (`status-color.helper.ts`), `shared/functions/` (`eventPaginator.ts`).
- Para UI genérica usa **Angular Material** y `@ng-matero/extensions`; no reinventes
  botones, tablas, diálogos, inputs, etc.
- Si un componente compartido casi sirve, **extiéndelo con `@Input()`/`@Output()`**
  en lugar de crear uno nuevo.

### 2. Genera la MENOR cantidad de CSS posible

- **Por defecto, un componente nuevo NO necesita SCSS propio.** Varios compartidos
  (ej. `chip-group`, `back-button`) no tienen archivo `.scss`. Apunta a eso.
- Usa las **clases utilitarias globales** (sistema tipo Bootstrap ya incluido) en lugar
  de escribir CSS: `d-flex`, `align-items-center`, `justify-content-between`,
  `m-*`/`p-*` (márgenes/padding), `text-*`, `rounded-*`, `border-*`, `gap-*`.
  Definidas en `src/assets/scss/helpers/` (`_display`, `_flexbox`, `_spacing`,
  `_text`, `_rounded`, `_border`) y `_custom-flex.scss`.
- Reutiliza clases globales ya definidas como `.status-badge` / `.status-N` y los
  helpers de color (`status-color.helper.ts`) en vez de recrear estilos de estado.
- Usa el theming de Material (variables de tema) en lugar de hardcodear colores hex.
- Escribe SCSS de componente **solo** cuando las utilidades no alcancen; si lo haces,
  manténlo mínimo y local al componente. Evita `!important` y selectores globales.
- No agregues estilos globales nuevos en `styles.scss` / `style.scss` salvo que sean
  genuinamente reutilizables en toda la app (y entonces, como utilidad, no ad-hoc).

### 3. Sigue el patrón existente

- Páginas nuevas en `bb-admin`: componentes **standalone** + `loadComponent` (ver
  [arquitectura mixta](.claude/memory/arquitectura-mixta.md)).
- Imita la estructura del feature vecino (carpeta `pages/`, `components/` locales,
  `*-routing.module.ts`).

## Convenciones

- Prefijo de componentes: `app`. Estilos en SCSS.
- Imports: se usa tanto `src/...` absoluto como rutas relativas; sigue el estilo del
  archivo vecino.
- Servicios HTTP: `@Injectable({ providedIn: 'root' })`, inyectan `HttpClient`,
  construyen URIs desde `environment` o `URIS_CONFIG`.
- Marca código obsoleto con `@deprecated` y apunta al reemplazo (ver `user.service.ts`).

## Despliegue

- **Docker / Render**: `Dockerfile` multi-stage + `serve`. Ver `RENDER_DEPLOY.md`.
- **IIS**: `npm run build:iis` (genera `dist/` y copia con `copy-to-iis.js`).

## Memoria del proyecto

La memoria de trabajo versionada vive en `.claude/memory/` y se commitea al repo
para compartir contexto entre sesiones y entre miembros del equipo.
- Índice: `.claude/memory/MEMORY.md` (una línea por memoria).
- Lee el índice al iniciar; agrega/actualiza memorias cuando se tomen decisiones,
  se fijen convenciones o se descubran detalles no obvios.

## Antes de dar por terminado

- Verifica que compila: `npm run build` (o `npm start` para probar en el navegador).
- No edites a ciegas las páginas de demo de `src/app/pages/`; el producto está en `bb-admin/`.
