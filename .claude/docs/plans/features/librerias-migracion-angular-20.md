# Librerías para migración a Angular 20

> Generado por **Agente 1 — Revisor de librerías** · Fecha: 2026-06-19
> Base: Angular 17.0.6 → objetivo Angular 20.x · Node v22 · npm 10
> Versiones objetivo verificadas vía `npm view <pkg> versions` y `npm view <pkg>@<v> peerDependencies` (rango de `@angular/core`).

Esta lista es el insumo del **Agente 2 — Actualizador**. Las versiones objetivo son las
**compatibles con Angular 20** (no necesariamente `@latest`, que en varias libs ya apunta a ng21/ng22).

---

## 1. Grupo Angular core (se actualizan JUNTAS por salto con `ng update`)

Angular **no permite saltar mayores**: hay que ir 17 → 18 → 19 → 20, un `ng update` por salto.
`@angular-devkit/build-angular`, `@angular/compiler-cli`, `typescript` y `zone.js` los gestiona y
sube automáticamente `ng update` en cada salto (no se listan como comandos sueltos).

| Salto | Librería | Versión actual | Versión objetivo (ng20) | Comando | ¿Se usa en src? | Estatus |
|---|---|---|---|---|---|---|
| 17→18 | Grupo Angular core (`@angular/*` + cli + cdk + material + material-moment-adapter + devkit + compiler-cli + typescript + zone.js) | 17.0.6 | 18.x | `ng update @angular/core@18 @angular/cli@18 @angular/cdk@18 @angular/material@18` | Sí | Done (salto intermedio; estado final 20.x) |
| 18→19 | Grupo Angular core | 18.x | 19.x | `ng update @angular/core@19 @angular/cli@19 @angular/cdk@19 @angular/material@19` | Sí | Done (salto intermedio; codemod `standalone:false` aplicado; estado final 20.x) |
| 19→20 | Grupo Angular core | 19.x | 20.x | `ng update @angular/core@20 @angular/cli@20 @angular/cdk@20 @angular/material@20` | Sí | Done — instalado: core 20.3.25, cli 20.3.29, cdk/material/moment-adapter 20.2.14, devkit 20.3.29, compiler-cli 20.3.25, typescript 5.9.3, zone.js 0.15.1 |

> **Nota (Grupo core):** las cuatro libs del comando (`@angular/core`, `@angular/cli`,
> `@angular/cdk`, `@angular/material`) se actualizan **juntas en un solo `ng update` por salto**.
> `@angular/material-moment-adapter` sube con el grupo Material. `typescript` debe quedar **≥ 5.8**
> y `zone.js` en **~0.15.x** al llegar a ng20 (lo exige `ng update`).

---

## 2. Terceros acoplados a Angular (se actualizan individualmente con `npm install`)

Aplicar tras el salto 19→20 (todas apuntan a su línea compatible con ng20).
Versión objetivo = la más alta confirmada compatible con `@angular/core ^20`.

| Salto | Librería | Versión actual | Versión objetivo (ng20) | Comando | ¿Se usa en src? | Estatus |
|---|---|---|---|---|---|---|
| ng20 | `@ng-select/ng-select` | ^13.5.0 | 20.7.0 (peer core `^20`) | `npm install @ng-select/ng-select@20.7.0` | Sí (solo `styles.scss`) | Done — instalado **20.7.0**. Build OK. |
| ng20 | `@ngx-translate/core` | ^14.0.0 | 18.0.0 (peer core `>=18`) | `npm install @ngx-translate/core@18.0.0` | Sí (4 archivos) | Done — instalado **18.0.0**. Requirió cambios de código (API v18): `TranslateModule.forRoot` → `provideTranslateService` + `provideTranslateHttpLoader` en `app.module`; `setDefaultLang` → `setFallbackLang` (headers); `TranslateModule` → `TranslatePipe` en nav-item standalone. Build OK. |
| ng20 | `@ngx-translate/http-loader` | ^7.0.0 | 18.0.0 (peer core `>=18`, requiere core ≥18) | `npm install @ngx-translate/http-loader@18.0.0` | Sí (vía core/app.module) | Done — instalado **18.0.0**. `TranslateHttpLoader` ya no se construye a mano; se usa `provideTranslateHttpLoader({prefix, suffix})`. Build OK. |
| ng20 | `@sweetalert2/ngx-sweetalert2` | ^13.0.0 | 15.0.0 (peer core incluye `^20`) | `npm install @sweetalert2/ngx-sweetalert2@15.0.0` | Sí (3 archivos) | Done — instalado **15.0.0** (+ `sweetalert2` ^11.26.25). Build OK (persiste warning CommonJS de `sweetalert2`, no bloqueante). |
| ng20 | `ng-apexcharts` | ^1.7.6 | 2.4.0 (peer core `>=20`, requiere `apexcharts ^5.10.3`) | `npm install ng-apexcharts@2.4.0 apexcharts@^5.10.3` | Sí (26 archivos) | Done — instalado **ng-apexcharts 2.4.0 / apexcharts 5.15.2**. Build OK. |
| ng20 | `ngx-scrollbar` | ^11.0.0 | 19.1.5 (peer core `>=20`) | `npm install ngx-scrollbar@19.1.5` | Sí (6 archivos) | Done — instalado **19.1.5**. Build OK (sin cambios de API necesarios). |
| ng20 | `ngx-permissions` | ^13.0.1 | 19.0.0 (peer core `>=13 || >25` → cubre 20) | `npm install ngx-permissions@19.0.0` | Sí (3 archivos) | Done — instalado **19.0.0**. Build OK. |
| ng20 | `ngx-pagination` | ^6.0.1 | 6.0.3 (peer core `>=13` → cubre 20) | `npm install ngx-pagination@6.0.3` | Sí (4 archivos) | Done — instalado **6.0.3** (= versión objetivo). |
| ng20 | `@kolkov/angular-editor` | ^2.1.0 | 3.0.5 (peer core `^20 || ^21`) | `npm install @kolkov/angular-editor@3.0.5` | Sí (3 archivos) | Done — instalado **3.0.5**. Build OK. |
| ng20 | `angular-calendar` | ^0.29.0 | 0.32.2 (peer core `>=20.2.0`; requiere `date-fns ^4`, `angular-draggable-droppable ^9`, `angular-resizable-element ^8`) | `npm install angular-calendar@0.32.2 date-fns@^4 angular-draggable-droppable@^9 angular-resizable-element@^8` | Sí (4 archivos) | Done — instalado **angular-calendar 0.32.2 + date-fns 4.4.0 + angular-draggable-droppable 9.x + angular-resizable-element 8.x**. Build OK (imports nombrados de date-fns compatibles con v4, sin cambios de código). |
| ng20 | `ng-block-ui` | ^4.0.1 | 4.0.1 (peer core `>=14` → técnicamente cubre 20, pero sin release específico ng20; **riesgo**) | `npm install ng-block-ui@4.0.1` | Sí (6 archivos) | Done — instalado **4.0.1** (sin cambio; peer `>=14` cubre 20). Build OK; funciona sobre ng20. |

> **Nota (terceros):** el Actualizador hace `npm install` lib por lib. Si un `install` rompe
> peer deps, marcar `Failed` y continuar (no detenerse). `angular-calendar` arrastra un salto de
> `date-fns` 2→4 que puede romper las libs agnósticas que usan date-fns 2 (ver §3): revisar.

---

## 3. Sin acción (agnósticas)

No dependen de Angular; **no requieren actualización para la migración** (salvo `date-fns`, ver aviso).

| Librería | Versión actual | Nota |
|---|---|---|
| `lodash` (+ `@types/lodash`) | ^4.17.21 | Agnóstica. Sin acción. |
| `moment` | ^2.30.1 | Agnóstica (la usa material-moment-adapter y angular-calendar). Sin acción. |
| `date-fns` (+ `@types/date-fns`) | ^2.29.3 → **^4.4.0** | Subida a **4.4.0** junto con `angular-calendar@0.32.2`. Los usos en `fullcalendar` son imports nombrados (`startOfDay`, `addDays`, etc.) compatibles con v4 — sin cambios de código. |
| `file-saver` (+ `@types/file-saver`) | ^2.0.5 | Agnóstica. Sin acción. |
| `fs-extra` | ^11.3.0 | Agnóstica (build/scripts). Sin acción. |
| `xlsx` | ^0.18.5 | Agnóstica. Sin acción. |
| `print-js` | ^1.6.0 | Agnóstica. Sin acción. |
| `plyr` | ^3.8.4 | Agnóstica. Sin acción. |
| `apexcharts` | ^3.40.0 | Agnóstica, **pero** acoplada vía `ng-apexcharts@2` que exige `^5.10.3` → sube con ng-apexcharts (ver §2). |
| `sweetalert2` | ^11.16.0 | Agnóstica, pero `@sweetalert2/ngx-sweetalert2@15` pide `sweetalert2 ^11.22.4` → subir a `^11.22.4`. |
| `sass` | ^1.57.1 | Agnóstica (build). Sin acción (subir si el CLI lo pide). |
| `serve` | ^14.2.0 | Agnóstica (script serve-prod). Sin acción. |
| `rxjs` | ~7.5.0 | Compatible con ng20 (≥7.4). `ng update` puede ajustar el rango. |
| `tslib` | ^2.3.0 | Compatible. Sin acción. |
| Karma + Jasmine (`karma*`, `jasmine-core`, `@types/jasmine`) | varias | Runner de tests. Karma queda **deprecado** en ng20 pero sigue funcionando; migración de runner = trabajo futuro, fuera de alcance. |

---

## 4. Riesgos / a reemplazar

| Librería | Versión actual | Estado ng20 | ¿Se usa en src? | Acción recomendada |
|---|---|---|---|---|
| `angular-tabler-icons` | ^2.7.0 | ⚠️ **SIN soporte ng20** — `@latest` 3.26.0 tiene peer `@angular/core 17 - 19`; no existe versión ni prerelease para ng20 | **Sí — 38 archivos** (íconos de toda la UI: sidebar, header, nav, dashboards) | **Failed (sin soporte ng20) — RIESGO ABIERTO.** Instalado **2.44.0** (peer core `14 - 17`, NO satisface ng20). El build compila y los íconos funcionan pese al peer no satisfecho, pero queda sin versión oficial ng20. Pendiente: evaluar reemplazo (`@tabler/icons-angular`/`@ng-icons` o `mat-icon`). |
| `angular-notifier` | ^14.0.0 | ⚠️ **SIN soporte ng20** | **Sí — 4 archivos** (`app.module`, `side-login`, `athlete-login`, `process-pdf-report`) | **Done (reemplazada).** Desinstalada (`npm uninstall angular-notifier`) y sustituida por `NotificationService` (wrapper de `MatSnackBar`, `src/app/services/notification.service.ts`) que conserva la firma `notify(type, message)`. Se quitó `NotifierModule`/`<notifier-container>` y el CSS en `angular.json`. Regla 04 actualizada. |
| `ng-block-ui` | ^4.0.1 | ⚠️ Sin release específico para ng20 (peer `>=14` lo permite pero proyecto sin mantenimiento reciente) | **Sí — 6 archivos** (loading/overlay) | **Done — funciona sobre ng20.** Instalado **4.0.1** (peer `>=14` cubre 20). Build OK; sin necesidad inmediata de reemplazo. |
| `@ng-matero/extensions` | ^17.0.0 | Hay versión ng20 (20.5.0, tag `v20-lts`) | **NO — 0 archivos** | **Done (desinstalada)** — `npm uninstall @ng-matero/extensions` OK. |
| `ng2-search-filter` | ^0.5.1 | ⚠️ **Abandonada** — última versión 0.5.1 (2019), sin soporte declarado | **NO — 0 archivos** | **Done (desinstalada)** — `npm uninstall ng2-search-filter` OK. |

> Para `@ng-matero/extensions` y `ng2-search-filter`, al no usarse en `src/`, lo más limpio es
> **desinstalarlas antes** de los saltos para que no bloqueen `ng update`/`npm install`.

---

## Nota final

**El Actualizador procesa la lista de arriba a abajo, marca `Done`/`Failed` en Estatus, y NO se
detiene ante fallos.**
