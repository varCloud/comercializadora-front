---
name: auth-token
description: Cómo funciona la autenticación (token JWT en localStorage)
type: reference
---

Autenticación basada en token JWT:

- El token se guarda en `localStorage` bajo la clave `token`.
- `src/app/interceptors/auth.interceptor.ts` agrega `Authorization: Bearer <token>`
  a cada request. Ante **401** limpia el token y redirige a
  `login/authentication/side-login`.
- `src/app/guards/auth.guard.ts` protege rutas verificando que exista el token
  (la verificación de roles/autorización por URL está comentada, pendiente).

APIs en `src/environments/`: `BASE_URL` (API v1 pública) y `BASE_URL_ADMIN` (API admin),
apuntando a `api.bodybooster.com.mx`. Segmentos de endpoints centralizados en
`src/app/config/uris-config.ts`.
