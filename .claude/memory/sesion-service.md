---
name: sesion-service
description: SesionService centraliza la sesión del usuario (signals); no usar localStorage directo
type: decision
---

La sesión del usuario se maneja con **`src/app/services/sesion.service.ts`** (`SesionService`,
`providedIn: 'root'`, basado en **signals**). Es la fuente única de la sesión autenticada.

Expone: `sesion` (signal readonly), `nombre`/`usuario`/`rol`/`permisos`/`estaAutenticado`
(computed), `token` (getter), y métodos `setSesion(sesion)`, `limpiar()`,
`tienePermiso(idPermiso)`. Persiste en `localStorage` (claves `token` y `sesion`) y rehidrata
en el constructor.

**Por qué:** evitar leer/escribir `localStorage` disperso por componentes y tener el estado
de sesión reactivo y reutilizable (header, guards, menús por permisos a futuro).

**Cómo aplicar:** tras el login, `setSesion(sesion)` (lo hace `side-login`). Para mostrar
datos del usuario, inyecta `SesionService` y usa sus signals (`sesion.nombre()`); ya se usa
en el header vertical (`layouts/full/vertical/header`) para pintar el nombre y en su logout
(`limpiar()`). No vuelvas a `localStorage.getItem('token'/'sesion')` directo. Ver
[[login-jwt-migrado]] y [[auth-token]].
