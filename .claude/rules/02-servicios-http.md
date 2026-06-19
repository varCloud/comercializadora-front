# Regla 02 — Servicios y llamadas HTTP

Toda comunicación con el backend pasa por un **servicio Angular**, nunca `HttpClient`
directo desde un componente.

## Convenciones

- Servicio: `@Injectable({ providedIn: 'root' })`, inyecta `HttpClient`, vive en
  `src/app/bb-admin/services/` (uno por dominio).
- **URLs nunca hardcodeadas.** Construye desde:
  - `environment.BASE_URL` (API pública v1) / `environment.BASE_URL_ADMIN` (API admin).
  - Segmentos de endpoint desde `src/app/config/uris-config.ts` (`URIS_CONFIG`).
- Constantes (paginación, avatar por defecto, etc.) desde `src/app/config/constants.ts`
  (`CONSTANTS`), no números/strings mágicos.
- El token y los headers los agrega `auth.interceptor.ts` automáticamente — no los
  pongas a mano en cada request.

## Patrones existentes

- Paginación: usa `PaginatorModel` + `eventPaginatorFunction`
  (`shared/functions/eventPaginator.ts`) y `CONSTANTS.PAGINATION`.
- En el componente, cierra el loading con `finalize(() => blockUI.stop())` en el `pipe`
  del observable (ver regla 04).
- Tipa las respuestas con modelos de `src/app/bb-admin/models/` (no `any` cuando exista
  o puedas crear el modelo).
- Marca métodos obsoletos con `@deprecated` apuntando al reemplazo (ver `user.service.ts`).
