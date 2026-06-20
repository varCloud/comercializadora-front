---
name: login-jwt-migrado
description: El login ya consume la API nueva (usuario/contrasena + JWT); contrato y storage
type: project
---

El login del front ya **no usa el contrato BodyBooster** (email/userType). Ahora:

- Postea `{ usuario, contrasena }` a `{environment.BASE_URL_ADMIN}/auth/login`
  (`URIS_CONFIG.SIGN_IN='auth'`) → la API `comercializadora-api`.
- Recibe `Notificacion<Sesion>` (`models/sesion.ts`); `login.service.ts` devuelve la `Sesion`
  (incluye `token` JWT).
- `side-login.component` guarda `localStorage.token` y `localStorage.sesion`. El
  `auth.interceptor` envía `Authorization: Bearer <token>` (ya existía).
- `environment.ts` (dev) apunta a `http://localhost:5163/api`. Prod/IIS siguen pendientes
  (ver [[pendiente-urls-backend]]).

**Cómo aplicar:** para tipar respuestas de auth usa `Sesion`/`Notificacion<T>` de
`models/sesion.ts`; los nombres de campo son en español (replican el JSON de la API).
Detalle completo en `.claude/docs/feature/login_jwt/salida_login_jwt.md`. Ver [[auth-token]].
