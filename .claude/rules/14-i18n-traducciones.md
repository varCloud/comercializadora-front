# Regla 14 — Internacionalización (ngx-translate)

El texto de UI se gestiona con **`@ngx-translate`**. Ya está configurado en `app.module`
(`provideTranslateService` + `provideTranslateHttpLoader`, `fallbackLang: 'en'`, archivos en
`src/assets/i18n/`). El **idioma por defecto es `es`** (se fija con `translate.use('es')` en
`AppComponent`; el header tiene un selector de idioma con banderas). **No** escribas el texto
visible directamente en plantillas/TS: usa claves y agrega su **descripción** en `en.json`
**y** `es.json`.

> Nota: `es.json` heredado del template trae claves del demo en portugués mal etiquetadas;
> no las toques. Para lo nuevo agrega tus propias claves con su valor correcto en cada idioma.

## Cómo aplicar

- **Una clave por texto**, agrupada por feature con notación de punto (objeto anidado).
  **Claves en `camelCase`** (no MAYÚSCULAS): `usuarios.title`, `usuarios.form.guardar`,
  `usuarios.msg.loadError`, …
- **Agrega la descripción en `en.json` y `es.json`** (ambos). El valor de `es.json` es el
  español; el de `en.json` el inglés.
- **En plantillas**: pipe `translate` (importa `TranslatePipe` en el componente standalone):
  ```html
  {{ 'usuarios.title' | translate }}
  <input [placeholder]="'usuarios.searchPlaceholder' | translate" />
  <button [matTooltip]="'usuarios.actions.editar' | translate">…</button>
  ```
- **En TS** (mensajes imperativos: `NotificationService`, `Swal`, etc.): inyecta
  `TranslateService` y usa `instant(...)`, con parámetros si aplica:
  ```ts
  this.translate.instant('usuarios.confirm.deactivateText', { nombre });
  ```
- Los **mensajes que vienen de la API** (`notificacion.mensaje`) ya llegan en español del
  backend: úsalos tal cual y deja una **clave de respaldo** traducida por si vienen vacíos.
- Identificadores de clave en inglés/MAYÚSCULAS; el texto en su idioma (regla 03).

Ejemplo real: feature `usuarios` (`usuarios.*` en `en.json`/`es.json`).
