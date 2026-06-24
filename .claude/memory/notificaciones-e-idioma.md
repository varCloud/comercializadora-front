---
name: notificaciones-e-idioma
description: Toasts con ngx-toastr vía NotificationService (única abstracción) e idioma default es
type: decision
---

# Notificaciones e idioma (convenciones de UI)

## Toasts: ngx-toastr vía NotificationService
- Los avisos tipo toast usan **`ngx-toastr`**, pero **siempre** a través de
  `src/app/services/notification.service.ts` (`notify(type, message)`). Es el **punto único
  de abstracción**: ningún componente importa ngx-toastr directo, así cambiar de librería =
  tocar solo ese archivo. (Antes era MatSnackBar; al usuario no le gustaba cómo se veía.)
- Config: `provideToastr({...})` en `app.module` + `node_modules/ngx-toastr/toastr.css` en
  `angular.json`. Requiere animations (ya está `BrowserAnimationsModule`).

## Idioma (ngx-translate)
- **Idioma por defecto: `es`**, fijado con `translate.use('es')` en `AppComponent`
  (fallback `en`). Ver regla 14.
- **Selector de idioma** en el header (`layouts/full/vertical/header`): estaba oculto con
  `*ngIf="false"`, se activó. Usa banderas `assets/images/flag/icon-flag-*.svg`.
- Claves i18n en **camelCase** (`usuarios.title`), descripción en `en.json` y `es.json`.
  Ojo: `es.json` heredado del template trae claves del demo en portugués mal etiquetadas.

Relacionado: [[modulo-usuarios]].
