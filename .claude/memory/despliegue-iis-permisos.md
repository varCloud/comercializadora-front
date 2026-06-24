---
name: despliegue-iis-permisos
description: 401.3 al desplegar en IIS por ACL NTFS rota (falta IUSR/Usuarios) en la carpeta del sitio.
metadata:
  type: gotcha
---

# Despliegue IIS — 401.3 por permisos NTFS

Al desplegar el front en IIS (`npm run build:iis` → `copy-to-iis.js` copia `dist/` a
`C:\inetpub\wwwroot\wms-lluvia-v2`) puede salir **error 401.3 "Acceso denegado / denegado
por las listas de Access Control"** al abrir el sitio.

**Causa:** la carpeta del sitio tenía la **herencia NTFS rota** y quedó **sin las cuentas
`IUSR` ni `Usuarios`** que sí tiene `C:\inetpub\wwwroot`. La autenticación anónima de IIS
usa la cuenta `IUSR`; si no tiene lectura sobre los archivos → 401.3. Tener solo
`IIS_IUSRS` **no** basta (es el grupo de identidades de pool, no cubre a `IUSR`).

**No** está relacionado con Angular 20 ni con Vite/esbuild; el layout del `dist` es correcto
(`index.html` y `web.config` en la raíz). Es puramente permisos de carpeta.

**Fix (idempotente, reversible):** conceder lectura/ejecución a `Usuarios` (SID
`*S-1-5-32-545`, nombre localizado en Windows ES) e `IUSR`, con herencia `(OI)(CI)`:

```powershell
icacls "C:\inetpub\wwwroot\wms-lluvia-v2" /grant "*S-1-5-32-545:(OI)(CI)(RX)" /grant "IUSR:(OI)(CI)(RX)" /T
```

**No requiere cambiar `copy-to-iis.js`:** `fs.emptyDir` no altera la ACL de la carpeta raíz,
y al dejar la herencia `(OI)(CI)` activa, los archivos copiados en cada redeploy heredan
`IUSR`/`Usuarios` automáticamente. Si reaparece, re-ejecutar el `icacls` de arriba.

Relacionado: [[origen-proyecto]] (build:iis con base-href `/wms-lluvia-v2/`).
