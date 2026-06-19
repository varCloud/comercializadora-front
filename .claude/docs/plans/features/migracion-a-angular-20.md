# Plan — Migración a Angular 20

> Estado: **propuesto** · Creado: 2026-06-19 · Owner: equipo front
> Tipo: feature / mantenimiento mayor

## 1. Objetivo

Migrar el proyecto de **Angular 17.0.x** a **Angular 20.x**, junto con sus
dependencias acopladas (Material/CDK, ng-matero, etc.), manteniendo la app
compilando y funcional.

## 2. Estado actual (línea base)

| Ítem | Versión actual | Objetivo (Angular 20) |
|---|---|---|
| Angular (`@angular/*`) | 17.0.6 | 20.x |
| Angular CLI / build | 17.0.6 | 20.x |
| TypeScript | ~5.2.2 | **≥ 5.8** |
| RxJS | ~7.5.0 | ≥ 7.4 (ok) |
| zone.js | ~0.14.2 | ~0.15.x |
| Node.js | **v22.22** ✅ | v20.19+ o v22.12+ (ya cumple) |
| Angular Material / CDK | 17.0.x | 20.x |

Características del repo que impactan la migración:
- **Uso intensivo de NgModules** (la raíz y `src/app/pages/*` son módulos clásicos).
  En **Angular 19 el default de `standalone` pasa a `true`** → la migración debe
  marcar como `standalone: false` los componentes declarados en NgModules.
- `strict: true` + `strictTemplates: true` → la actualización **expondrá errores de
  tipos en plantillas** que hoy pasan; hay que corregirlos.
- Muchas **librerías de terceros acopladas a Angular** (ver §4); es el mayor riesgo.

## 3. Estrategia

Angular **no permite saltar mayores**: hay que ir **17 → 18 → 19 → 20**, usando
`ng update` en cada salto (aplica schematics/migraciones automáticas).

- Trabajar en una rama dedicada (p. ej. `feature/migracion-angular-20`).
- Un commit por salto de versión (17→18, 18→19, 19→20) para poder revertir por fase.
- Tras cada salto: `npm run build` + `npm test` + prueba manual (login, sidebar,
  navegación a `/admin`, una pantalla con tabla/diálogo).
- Congelar otras features durante la migración para evitar conflictos.

Comando base por salto:
```bash
npx ng update @angular/core@18 @angular/cli@18 @angular/cdk@18 @angular/material@18
# revisar cambios, build, test, commit. Repetir con @19 y luego @20.
```
> `npx ng update` (sin args) muestra la matriz de qué se puede actualizar y avisos.

## 4. Auditoría de dependencias (riesgo principal)

Antes de empezar, verificar para CADA librería si existe versión compatible con
Angular 20. Las **acopladas a Angular**:

| Paquete | Actual | Riesgo / nota |
|---|---|---|
| `@angular/material`, `@angular/cdk`, `@angular/material-moment-adapter` | 17 | Bajo — `ng update` las maneja. OJO Material 3 (M3) ya es default desde v18. |
| `@ng-matero/extensions` | 17 | Medio — debe subir a la línea 20. |
| `@ng-select/ng-select` | 13 | Medio — su versión mayor sigue a Angular; subir a la compatible con 20. |
| `@ngx-translate/core` + `http-loader` | 14 / 7 | Medio — APIs cambiaron (standalone provider). Revisar. |
| `angular-tabler-icons` | 2.7 | Medio — v3+ para standalone/Angular nuevo. |
| `ng-apexcharts` | 1.7 | Bajo/Medio — hay versiones para Angular 20. |
| `ngx-scrollbar` | 11 | Medio — subir a línea compatible. |
| `@sweetalert2/ngx-sweetalert2` | 13 | Bajo — versiones recientes soportan ng20. |
| `angular-notifier` | 14 | Medio — verificar release para ng20. |
| `angular-calendar` | 0.29 | **Alto** — proyecto de actualización lenta; confirmar soporte ng20. |
| `@kolkov/angular-editor` | 2.1 | **Alto** — suele quedarse atrás; posible reemplazo. |
| `ng-block-ui` | 4 | **Alto** — verificar soporte ng18+; si no, reemplazar (usado para loading). |
| `ngx-permissions` | 13 | **Alto** — mantenimiento lento; confirmar o reemplazar. |
| `ngx-pagination` | 6 | **Alto** — confirmar soporte; si no, alternativa. |
| `ng2-search-filter` | 0.5 | **Alto** — abandonado; probablemente reemplazar por filtro propio. |

Agnósticas de Angular (sin riesgo de framework): `lodash`, `moment`, `date-fns`,
`file-saver`, `fs-extra`, `xlsx`, `print-js`, `plyr`, `sass`, `serve`.

> Mucho de lo "Alto" puede ya no usarse tras eliminar el dominio BodyBooster. **Antes
> de actualizar/reemplazar, confirmar con `grep` si la librería todavía se usa** y, si
> no, **desinstalarla** (reduce el trabajo de migración).

## 5. Lista de tareas

### Fase 0 — Preparación
- [ ] Crear rama `feature/migracion-angular-20`.
- [ ] Confirmar que `main`/rama base compila (`npm run build`) y corre tests (`npm test`).
- [ ] Commit/snapshot del estado actual (línea base reversible).
- [ ] Ejecutar `npx ng update` (sin args) y guardar la matriz de recomendaciones.
- [ ] **Auditar uso real** de cada dependencia de §4 (`grep`) y **eliminar las no usadas**.
- [ ] Listar, por cada lib que sí se usa, la versión objetivo compatible con Angular 20.

### Fase 1 — Angular 17 → 18
- [ ] `ng update @angular/core@18 @angular/cli@18 @angular/cdk@18 @angular/material@18`.
- [ ] Revisar migración de Material a **M3** (tokens/temas); ajustar
      `_default_theme.scss` y temas si cambia la API (ver memoria `paleta-marca`).
- [ ] Actualizar libs de terceros a su versión para Angular 18.
- [ ] `npm run build` + `npm test` + prueba manual. Corregir errores de plantilla/tipos.
- [ ] Commit "chore: angular 18".

### Fase 2 — Angular 18 → 19
- [ ] `ng update @angular/core@19 @angular/cli@19 @angular/cdk@19 @angular/material@19`.
- [ ] **Verificar la migración de `standalone`**: los componentes declarados en NgModules
      deben quedar con `standalone: false`; los standalone, sin el flag. Revisar `admin/`.
- [ ] Actualizar libs de terceros a su versión para Angular 19.
- [ ] `npm run build` + `npm test` + prueba manual. Corregir.
- [ ] Commit "chore: angular 19".

### Fase 3 — Angular 19 → 20
- [ ] `ng update @angular/core@20 @angular/cli@20 @angular/cdk@20 @angular/material@20`.
- [ ] Subir **TypeScript a ≥ 5.8** y `zone.js` a ~0.15 (lo pide `ng update`).
- [ ] Aplicar migraciones/codemods que sugiera el CLI (control flow, etc.).
- [ ] Actualizar libs de terceros a su versión para Angular 20.
- [ ] `npm run build` + `npm test` + prueba manual completa. Corregir.
- [ ] Commit "chore: angular 20".

### Fase 4 — Limpieza y verificación
- [ ] Revisar `angular.json`/`tsconfig*` por opciones deprecadas; ajustar budgets si hace falta.
- [ ] Validar los 3 builds: `npm run build`, `npm run build:iis`, y `npm start` (dev).
- [ ] Revisar deprecaciones en consola y warnings del compilador.
- [ ] Probar flujos clave: login (`side-login`), guard/redirect a `/admin`, sidebar
      (prod vs dev, ver regla 07), tema/colores de marca, una pantalla con tabla y diálogo.
- [ ] Actualizar `CLAUDE.md` (stack) y memoria con las versiones nuevas.
- [ ] PR a la rama base.

## 6. Validación (criterios de aceptación)
- `npm run build` y `npm run build:iis` sin errores.
- `npm test` en verde (o tests ajustados a las APIs nuevas).
- App levanta con `npm start`; login, navegación y un CRUD/tabla funcionan.
- Sin dependencias rotas (peer deps) ni librerías sin versión compatible.

## 7. Riesgos y mitigación
- **Libs sin soporte ng20** (angular-editor, ng-block-ui, ngx-permissions, ngx-pagination,
  ng2-search-filter, angular-calendar): mitigar eliminando las no usadas y reemplazando
  las necesarias por alternativas mantenidas o implementación propia.
- **Material M3**: el look puede cambiar; reservar tiempo para reajustar el tema de marca.
- **strictTemplates**: pueden aparecer muchos errores de tipos; presupuestar corrección.
- **Karma deprecado** en ng20: los tests siguen corriendo, pero planear migración futura
  del runner si se vuelve bloqueante.

## 8. Notas
- Toda decisión relevante durante la migración → registrarla en `.claude/memory/`.
- No commitear automáticamente (regla 05 vigente): commitear por fase cuando se pida.
