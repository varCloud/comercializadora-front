---
name: despliegue-smarterasp
description: Build y despliegue del front en SmarterASP.NET (dominio raíz admin-v2.comercializadoralluvia.com).
metadata:
  type: project
---

# Despliegue SmarterASP.NET — dominio raíz

El front se publica en SmarterASP.NET bajo el dominio **`admin-v2.comercializadoralluvia.com`**
en la **raíz** (no en subcarpeta como el IIS local de `/wms-lluvia-v2/`). Por eso hay una
configuración de build **separada**, sin tocar `build:iis`.

## Qué se creó

- **Script:** `npm run build:smarterasp` → `ng build -c=production-smarterasp`.
- **Configuración angular.json `production-smarterasp`:** igual a producción pero con
  `baseHref: "/"`, su `fileReplacements` a `environment.smarterasp.prod.ts`, y override de
  `assets` para copiar el web.config de raíz desde `src/deploy/smarterasp/web.config`.
- **`src/environments/environment.smarterasp.prod.ts`:** ⚠️ con **URL de API placeholder**
  (`https://api.comercializadoralluvia.com/api`) — falta la real (ver [[pendiente-urls-backend]]).
- **`src/deploy/smarterasp/web.config`:** rewrite SPA a **`/index.html`** (raíz), distinto del
  `src/web.config` de subcarpeta que apunta a `/wms-lluvia-v2/index.html`.

## Diferencias clave vs IIS local (subcarpeta)

| | IIS local (`build:iis`) | SmarterASP (`build:smarterasp`) |
|---|---|---|
| base-href | `/wms-lluvia-v2/` | `/` |
| web.config rewrite | `/wms-lluvia-v2/index.html` | `/index.html` |
| environment | `environment.iis.prod.ts` | `environment.smarterasp.prod.ts` |
| copia | `copy-to-iis.js` (local) | **FTP / File Manager** de SmarterASP |

## Despliegue (manual)

1. `npm run build:smarterasp` → genera `dist/` (incluye `index.html` con `base href="/"` y el
   `web.config` de raíz).
2. Subir **el contenido de `dist/`** (no la carpeta) por FTP/File Manager de SmarterASP a la
   carpeta del sitio (normalmente `wwwroot`). **No** se usa `copy-to-iis.js`.

## Pendientes

- Definir la **URL real de la API** y ponerla en `environment.smarterasp.prod.ts` (debe ser
  **HTTPS** para evitar mixed content). Hoy es placeholder.

Relacionado: [[despliegue-iis-permisos]] (IIS local, subcarpeta), [[pendiente-urls-backend]].
