---
name: sin-residuo-bodybooster
description: No debe existir nada de atleta/creador (BodyBooster) en el proyecto; eliminar al verlo
type: feedback
---

El usuario indicó que **no debe existir nada de "atleta"/"creador" (ni dominio BodyBooster)**
en este proyecto. Es plantilla reutilizada y ese código es residuo a eliminar, no a adaptar.

**Por qué:** el producto es Comercializadora Lluvia; el dominio BodyBooster confunde y
ensucia. El usuario prefiere borrarlo a conservarlo "por si acaso".

**Cómo aplicar:** al toparte con residuo BodyBooster (athlete/atleta, creator/creador,
`UserModel`, `UserTypeEnum`, etc.), **elimínalo** (componente + ruta + referencias), no lo
adaptes. Ya se eliminó `pages/authentication/athlete-login` y el enum `UserTypeEnum`.
Candidatos pendientes: `boxed-login` y demás demos de `pages/authentication/`, `models/user.ts`
(`UserModel`) si quedan sin uso. Ver [[origen-proyecto]] y [[login-jwt-migrado]].
