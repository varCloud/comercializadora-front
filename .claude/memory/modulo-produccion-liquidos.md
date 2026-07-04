# Módulo Producción Líquidos (reporte de solo lectura)

**Tipo:** decision / reference

Primer **reporte puro** del producto (sin alta/edición/baja): migra
`ConsultarLiquidos`/`BuscarCargaMercanciaLiquidos`/`ConsultarUsuariosLiquidos` de
`ProductosController` (legado). Ruta `/admin/produccion-liquidos`, entrada de menú bajo
"Productos" (icono `droplet`, junto a Relación Líquidos/Trapeadores y Límites de inventario).
Endpoint: `GET /api/produccion-liquidos?page=&perPage=&idRol=&idUsuario=&fechaIni=&fechaFin=&order=&sort=`.

## Decisiones de diseño que se apartan de lo literal del encargo

- **Rango de fechas: originalmente `input type="date"` nativo, migrado después a
  `mat-date-range-input`.** Al migrar la pantalla (2026-07-03) ya existía un precedente real en
  el producto (`compras-list`, filtro proveedor/usuario/estatus/fecha) con dos
  `FormControl<string|null>` y `<input matInput type="date">`, para evitar depender de
  `DateAdapter`/`MatNativeDateModule` (no registrados a nivel app). Se siguió ese patrón
  inicialmente. **Actualización (misma sesión, feature `produccion_trapeadores`):** se
  estableció la regla dura 18 (`mat-date-range-input` obligatorio para rango de fechas) y
  **`produccion-liquidos-list` se migró** al nuevo patrón (`MatNativeDateModule` importado en
  el componente standalone + `[rangePicker]`/`[for]` apuntando al mismo `#picker` + `[max]` =
  hoy), quedando **`compras-list` como el único listado pendiente** de migrar a
  `mat-date-range-input`. Ver `modulo-produccion-trapeadores.md` (primer módulo que nació
  directamente con el patrón nuevo, sirve de referencia).
- **Ruteo: `loadChildren` a un `*-routing.module.ts` propio, no `loadComponent` directo en
  `admin-routing.module.ts`.** El encargo original decía "ruta con `loadComponent` en
  `admin-routing.module.ts`", pero **todos** los dominios vecinos (`relacion-liquidos`,
  `compras`, `productos`, …) usan `loadChildren` → `<dominio>-routing.module.ts` (que sí usa
  `loadComponent` internamente). Se siguió el patrón real del repo por consistencia (regla 00).
- **Cascada rol → usuario sin endpoint de catálogo propio.** El legado filtraba
  `ConsultarLiquidos`/`ConsultarUsuariosLiquidos` a los roles `12` y `13` únicamente
  (`ProductosController.cs` ~línea 650/694). Se reusa `UsuariosService` ya existente:
  - Rol: `usuariosService.obtenerRoles()` filtrado en el componente a `id ∈ {12, 13}` (constante
    `ROLES_LIQUIDOS`), pintado en `mat-select` (≤10 opciones, regla 16) con opción "TODOS".
  - Usuario: sin rol elegido, se hacen **dos** llamadas `usuariosService.listar({idRol: 12/13,
    perPage: 200})` en paralelo (`forkJoin`) y se mezclan los resultados — replica el
    `Where(idRol==12 || idRol==13)` del legado sin depender de que el back filtre por defecto.
    Con rol elegido, una sola llamada `listar({idRol, perPage: 200})`. Selector `ng-select`
    (regla 16, tier "carga todos los items"; no se usó `mat-select` porque el conteo de
    usuarios por rol no está garantizado ≤10, ni `app-select-paginado` porque el universo ya
    está acotado por rol y no amerita scroll infinito server-side).
- **Chip de rol sin `idRol`:** la entidad `CargaMercanciaLiquidos` solo trae `descripcionRol`
  (texto), no el id — a diferencia del patrón de la regla 10 (`rolColor(id)` con módulo sobre un
  array de colores), aquí `rolColor(descripcion)` usa un hash simple del string para elegir el
  color determinístico.
- **Sin buscador de texto ni columna de acciones**: único listado del producto sin `q` (regla 13
  no aplica, confirmado en la HU) y sin `mat-column="action"` (sin CRUD). No se creó el fix de
  `stickyEnd`/columna sticky porque no hay columna fija a la derecha.
- **SCSS en archivo propio desde el inicio** (`produccion-liquidos-list.component.scss` con
  `styleUrl`), no inline en el decorador — evita sumar un 7° caso al pendiente ya registrado en
  `pendiente-fix-scss-inline-relacion-liquidos.md`.

Detalle completo en `.claude/docs/feature/produccion_liquidos/` del workspace raíz (`hu_`,
`task_` — API y front completos y aprobados, FE-1..FE-7 ✅).

## Revisión (revisor-frontend, 2026-07-03)

Checklist completo aprobado, sin hallazgos bloqueantes; `npm run build` en verde (0 errores).
Las 4 decisiones del migrador se verificaron contra precedentes reales del repo (no
inventados): fechas nativas = mismo patrón que `compras-list`; ruteo `loadChildren` = mismo
patrón que **todos** los dominios de `admin-routing.module.ts` (Proveedores, Clientes,
Productos, Compras…); reuso de `UsuariosService` replica fielmente el filtro
`idRol==12||13` del legado.

**Dato nuevo para futuros selectores "carga todo" (regla 16, tier 11-25):** el total de
usuarios activos en todo el sistema es **~18** (constatado en
`comercializadora-api/.claude/memory/modulo-usuarios.md`). Esto da margen amplio para
cualquier `ng-select` que cargue "todos los usuarios" o un subconjunto por rol sin paginado
real — el cap de `perPage: 200` usado aquí nunca se acerca a truncar datos. Único nit menor
detectado: ese `200` es un literal en el componente (no hay una constante equivalente en
`CONSTANTS` para el tier "carga todo" de selectores, a diferencia de los `perPage: 25` usados
en los `fetchPage` de `app-select-paginado`); se dejó como sugerencia de pulido, no bloqueante.
