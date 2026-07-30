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
- [04 — Errores y loading](04-errores-y-loading.md): `ng-block-ui` + `NotificationService` (MatSnackBar).
- [05 — Commits](05-commits.md): convención de mensajes.
- [06 — Arquitectura](06-arquitectura.md): standalone + `loadComponent` en admin.
- [07 — Menú de navegación](07-menu-navegacion.md): rutas de producto en `navItemsApp`; prod muestra solo lo nuestro.
- [08 — Angular moderno](08-angular-moderno.md): standalone + signals + control flow nativo (`@if`/`@for`), no `*ngIf`/`*ngFor`.
- [09 — Modelos interface + clase](09-modelos-interface-clase.md): cada interface lleva su clase `XModel implements X`; instancia respuestas con `new XModel(...)`.
- [10 — Tablas / listados](10-tablas-listados.md): basados en `datatable/kichen-sink`; acciones con iconos `i-tabler`; paginación server-side.
- [11 — Modelos por feature](11-modelos-feature.md): `admin/models/<feature>/`; un archivo = una interfaz + su modelo; genéricos en `shared/`.
- [12 — Modales y formularios](12-modales-formulario.md): basados en `forms/form-vertical`; dimensionar el diálogo (`width`/`maxWidth`).
- [13 — Buscador en listados](13-busqueda-listados.md): todo listado lleva buscador; front input con debounce, back query param `search`.
- [14 — i18n (ngx-translate)](14-i18n-traducciones.md): texto de UI con claves; descripciones en `en.json` y `es.json`; `TranslatePipe`/`TranslateService`.
- [15 — Selector de Sucursal](15-selector-sucursal.md): sucursal Uruapan por defecto y **bloqueada** en todo selector; id en `CONSTANTS.SUCURSAL_DEFAULT`.
- [16 — Selectores ng-select](16-selectores-ngselect.md): ≤10 → `mat-select`; 11–25 → `ng-select` (filtro cliente); **>25 → `app-select-paginado`** (paginado en scroll + búsqueda servidor + `arrayUnique`; carga 25 al iniciar).
- [17 — Controles deshabilitados](17-controles-deshabilitados.md): estilo global (fondo gris tenue + cursor `not-allowed`) para todo control `disabled`; centralizado en `style.scss`, no por componente.
- [18 — Rango de fechas](18-rango-fechas.md): fecha inicio + fecha fin → `mat-date-range-input` (nunca dos inputs `type="date"`); **default = hoy/hoy, visible desde la carga inicial** (Limpiar restaura el mismo default); hoy siempre seleccionable como mínimo/máximo; ajustar CSS local si no calza con la plantilla.
- [19 — Formato de moneda](19-formato-moneda.md): pipe `currency` **siempre** con argumentos explícitos `'MXN' : 'symbol-narrow' : '1.2-2'`; prohibido `| currency` a secas (usa `USD` por defecto en vez de `$`).
