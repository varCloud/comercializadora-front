# Reglas de desarrollo — comercializadora-front

Reglas que Claude (y el equipo) debe seguir al trabajar en este proyecto.
Una regla por archivo. Léelas antes de crear o modificar código.

Al agregar una regla nueva: crea un archivo aquí y registra su línea en este índice.
No engordes `CLAUDE.md`; ahí solo va el puntero a esta carpeta.

## Índice

- [00 — Reuso de componentes](00-reuso-componentes.md): reutilizar antes de crear.
- [01 — CSS mínimo](01-css-minimo.md): generar el mínimo CSS; usar utilidades globales.
- [02 — Servicios / HTTP](02-servicios-http.md): `environment` + `uris-config`, sin URLs hardcodeadas.
- [03 — Idioma](03-idioma.md): UI en español, identificadores de código en inglés.
- [04 — Errores y loading](04-errores-y-loading.md): `ng-block-ui` + `angular-notifier`.
- [05 — Commits](05-commits.md): convención de mensajes.
- [06 — Arquitectura](06-arquitectura.md): standalone + `loadComponent` en admin.
- [07 — Menú de navegación](07-menu-navegacion.md): rutas de producto en `navItemsApp`; prod muestra solo lo nuestro.
