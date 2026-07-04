# Módulo Producción Trapeadores (reporte de solo lectura)

**Tipo:** decision / reference

Feature hermana de **Producción Líquidos** (mismo patrón, dominio distinto): migra
`ConsultarProduccionProductos` de `ProductosController` (legado), que reutiliza el mismo
action/DAO/SP que Producción Líquidos fijando `idTipoMovimiento = 32` (trapeadores) vía hidden
field. Ruta `/admin/produccion-trapeadores`. Endpoint:
`GET /api/produccion-trapeadores?page=&perPage=&idRol=&idUsuario=&fechaIni=&fechaFin=&order=&sort=`.

## Decisiones de diseño

- **Primer módulo que nace directamente con `mat-date-range-input`** (regla dura 18, ya
  establecida al momento de migrar esta pantalla). Sirve de referencia end-to-end: componente
  standalone con `MatNativeDateModule` en `imports`, `[rangePicker]="rangoFechasPicker"` en el
  `mat-date-range-input` y `[for]="rangoFechasPicker"` en el toggle apuntando al mismo
  `#rangoFechasPicker`, `[max]="hoy"` (sin `[min]`). Ver también `modulo-produccion-liquidos.md`
  (esa pantalla se migró al mismo patrón en esta misma sesión).
- **Menú: ítem de nivel superior**, no anidado bajo "Productos". La HU original pedía colgarlo
  bajo el grupo "Productos" junto a "Producción líquidos", pero al revisar
  `sidebar-evaluaciones-data.ts` real, "Producción líquidos" **ya es** un ítem de nivel superior
  (hermano de "Productos"/"Clientes"/"Compras"), corregido así en una sesión previa a pedido del
  usuario. Por consistencia, "Producción trapeadores" se agregó también como ítem de nivel
  superior, inmediatamente después de "Producción líquidos".
- **Ícono Tabler `wash`** (no `broom`/`mop`, que no existen en `angular-tabler-icons`). Se
  descartó `vacuum-cleaner` (SVG pobre, casi vacío) y `bucket-droplet` (ya usado por "Relación
  Trapeadores", habría duplicado ícono entre hermanos del menú).
- **Entidad propia `CargaMercanciaTrapeadores`** (API) en vez de reusar `CargaMercanciaLiquidos`:
  mismo shape/columnas, pero separación de dominio deliberada (mismo criterio que
  `RelacionLiquidos`/`RelacionTrapeadores`).
- **Reuso completo del módulo Usuarios** (roles 12/13, cascada rol→usuario): mismo mecanismo que
  Producción Líquidos, sin catálogo propio. Roles 12/13 confirmados contra el legado
  (`ProductosController.cs` ~línea 675-683, `ConsultarProduccionProductos`).
- **Sin buscador de texto ni columna de acciones**: igual que Producción Líquidos (reporte puro).

Detalle completo en `.claude/docs/feature/produccion_trapeadores/` del workspace raíz (`hu_`,
`task_`, `salida_` — API y front completos y aprobados).

## Revisión (revisor-frontend, 2026-07-03)

Checklist completo aprobado sin hallazgos bloqueantes; `npm run build` en verde. Confirmó que la
regla 18 se aplicó correctamente (calendario abre, `MatNativeDateModule` presente,
`[rangePicker]`/`[for]` consistentes) y que el ícono `wash` existe realmente en el paquete
instalado.
