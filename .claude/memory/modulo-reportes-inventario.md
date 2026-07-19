---
name: modulo-reportes-inventario
description: Primera sub-feature del módulo Reportes; listado paginado + 2 exportaciones completas que ignoran filtros; nueva sección de menú "Reportes"
type: project
---

Primera sub-feature del módulo legado **Reportes** (el más grande de los pendientes:
Ventas, Devoluciones, Merma, MargenBruto, DropSize, Cierres, CostoProducción,
DiasPromedioInventario, etc. — se migran uno a la vez, ver
`.claude/docs/feature/reporte_inventario/`).

## Estructura

- `admin/models/reportes-inventario/inventario-reporte-item.ts` — sin request-model propio de
  filtros: reusa `ListarParams` (`admin/models/shared/listar-params.ts`) directo en el servicio,
  mismo criterio que Consumo de MPL.
- `admin/services/reportes-inventario.service.ts` — `listar`/`irLink` estándar (regla 10) +
  `exportar(tipo)` (ver memoria `exportacion-descarga-vs-diferido-front.md` para el detalle del
  patrón Descarga/Diferido, primer consumidor en el front).
- `admin/feature/reportes/inventario/pages/inventario-list/` + `inventario-reportes-routing.
  module.ts`, enganchado en `admin-routing.module.ts` como `reportes/inventario` (ruta
  independiente top-level bajo `admin`, no anidada dentro de un routing "reportes" compartido —
  cada sub-reporte futuro agrega su propia entrada `reportes/<x>` en `admin-routing.module.ts`).

## Filtros y catálogos (regla 00 — reuso, sin catálogos nuevos)

- **Línea de Producto**: `ProductosService.obtenerLineas()` (ng-select, catálogo finito).
- **Almacén**: `UsuariosService.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID)` (ng-select).
  Mismo patrón que Consumo de MPL/Producción Líquidos.
- Rango de fechas `mat-date-range-input` default hoy/hoy (regla 18): el back solo usa
  `fechaFin` como corte de snapshot (`InventarioDetalleLog` no se expande día a día por costo,
  ~5.3M filas), pero la UI igual manda ambas fechas (paridad con el resto de pantallas).
- Buscador de texto libre con debounce 350ms sobre `q` (regla 13) — **no** `search` (la API usa
  la convención real del repo `PagedQuery.Q`, divergencia detectada y corregida en 02-tasks).

## Las 2 exportaciones NO llevan los filtros de pantalla

Paridad exacta con el legado (decisión explícita del usuario, documentada en la HU): "Reporte
General" (`exportar(1)`) y "Reporte por Ubicación" (`exportar(2)`) exportan **todo** el
inventario sin importar línea/almacén/fechas/buscador activos — solo se envía `tipo`. Usan un
`@BlockUI` propio (`'reportesInventarioExportar'`) separado del bloque del listado, para no
bloquear toda la pantalla mientras se genera el reporte.

## Menú

Primera sección **"Reportes"** en `navItemsApp` (`sidebar-evaluaciones-data.ts`): `navCap`
nuevo + ítem "Inventario" (ícono `report`), después de Facturas Pedidos Esp. Los próximos
sub-reportes del módulo se agregan como ítems adicionales bajo el mismo `navCap`.

## Runtime verificado

- `npm run build`: sin errores (solo warnings preexistentes de Sass `@import` y CommonJS de
  `jsbarcode`/`qrcode`, no relacionados).
- `GET /api/reportes/inventario` probado con JWT real (usuario `admin`): contrato de campos
  exacto (`fecha, almacen, descripcionLinea, descripcion, codigoBarras, cantidad, costo`),
  `links`/`meta` de paginación correctos, 10180 filas totales en la BD local.
- `GET /api/reportes/inventario/exportar?tipo=1|2`: siempre `400` en este entorno por el gap de
  `Usuario.Correo` (ver memoria de exportación) — rama de descarga/diferido exitoso **no
  verificada en runtime real**, solo a nivel de lógica de parseo (script Node con `fetch`/`Blob`
  contra la API real, mismo resultado que tendría el navegador).
- `ng serve` (puerto 4201, para no chocar con una instancia ya corriendo en 4200): compiló sin
  errores; el bundle `main.js` contiene la ruta `reportes/inventario` y el string `Reportes` del
  menú; el módulo de la pantalla queda en un chunk lazy aparte (no aparece en `main.js`, señal de
  que el `loadChildren`/`loadComponent` está correctamente separado). No se pudo hacer click-
  through real (sin herramienta de navegador disponible en el entorno del agente) — pendiente de
  una verificación manual en navegador real por el usuario o `revisor-frontend` con herramientas
  distintas.
