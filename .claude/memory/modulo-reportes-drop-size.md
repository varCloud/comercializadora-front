---
name: modulo-reportes-drop-size
description: Feature Reportes > Drop Size completa (API+Front); paginación server-side (3 tipos), rango de fechas OPCIONAL (regla 18 estándar, igual criterio que dias_promedio_inventario), único quirk -1 del backend ("sin ventas")
type: project
---

# Módulo Reportes > Drop Size

Octavo sub-reporte del módulo "Reportes" (2026-07-22). Migra `ReportesController.DropSize/
ObtenerDropSize` del legado (`SP_INDICADOR_DROPSIZE`, reusa `EnumTipoMargenBruto`). FE-1..FE-4
completos, build (`npm run build`) verificado, 0 errores, sin warnings nuevos.

## Archivos
- `admin/models/reportes-drop-size/` — `DropSizeItem`/Model (`id`, `descripcion`,
  `codigoBarras?`, `totalClientes`, `totalVentas`, `totalProductos`, `dropSizeVentas`,
  `dropSizeCantidad`); `TipoDropSizeId` (enum Global=1/Línea=2/Producto=3 — el 4º valor
  legado `Venta_Producto` de `EnumTipoMargenBruto` es código muerto, NO se migró) + opciones
  de catálogo + set de tipos con código de barras; `DropSizeSearchParams`/Model (fechas
  **opcionales**, `tipo` obligatorio — igual criterio que `dias_promedio_inventario`).
- `admin/feature/reportes/drop-size/` — routing + `pages/drop-size-list/{.ts,.html}`.
- Ruta `reportes/drop-size` en `admin-routing.module.ts`; entrada en `navItemsApp`/
  `sidebar-evaluaciones-data.ts` (ícono `droplet`).
- i18n: `reportesDropSize.*` en `es.json`/`en.json`.
- `admin/services/reportes-drop-size.service.ts` — `ReportesDropSizeService`:
  `listar(filtros)`, `irLink(url)`, `exportarCSV(filtros)`. Entrada `REPORTE_DROP_SIZE:
  'drop-size'` en `uris-config.ts`.

## Decisiones / desvíos respecto a los hermanos (margen_bruto / dias_promedio_inventario)

- **`tipo` OBLIGATORIO** (a diferencia de `dias_promedio_inventario`, donde el SP defaultea
  a Global si no viene): la API responde `400` si falta o está fuera de 1-3. El `mat-select`
  del formulario siempre envía un valor (default Global), así que en la práctica nunca se
  omite.
- **Rango de fechas OPCIONAL** (regla 18 estándar, default hoy/hoy visible, sin
  `Validators.required`) — igual criterio que `dias_promedio_inventario`, a diferencia de
  `margen_bruto` (fechas obligatorias). El SP_V2 defaultea a "hoy" internamente si no se
  envían — **decisión deliberada de rendimiento**, no porque el SP legado (`SP_INDICADOR_
  DROPSIZE`) ya lo hiciera así: el legado usa `COALESCE(@fechaIni, v.fechaAlta)` por fila,
  que en la práctica anula el filtro y escanea ~3.6M filas de `VentasDetalle` (medido:
  2m27s sin fechas). El backend documentó esto en su propia memoria
  (`comercializadora-api/.claude/memory/modulo-reportes-dropsize.md`).
- **Solo 3 tipos** en el selector (Global/Línea/Producto) — `Venta_Producto` fuera de
  alcance, mismo criterio que `dias_promedio_inventario`.
- **Paginación server-side** por consistencia con los 2 hermanos más recientes, no por
  volumen confirmado (bajo, acotado por catálogo).
- Ubicación de modelos/servicio sigue la convención plana `reportes-<feature>/` (igual
  criterio que el resto de hermanos).

## Hallazgo — quirk de la API: UN solo código de negocio bajo HTTP 400

A diferencia de `dias_promedio_inventario` (dos códigos, `-400`/`-1`), Drop Size solo tiene
**un** motivo de negocio bajo HTTP 400 (igual que `margen_bruto`):
- `estatus:-1` — "No se encontraron ventas para calcular el indicador dropsize, con esos
  términos de búsqueda." (incluye el caso default hoy/hoy si hoy no tuvo ventas).

**Solución aplicada en `ReportesDropSizeService`:** mismo patrón que
`ReportesMargenBrutoService`/`ReportesDiasPromedioInventarioService` — el servicio captura
el error en `listar()`/`irLink()`/`exportarCSV()`, inspecciona `err.error?.estatus === -1`.
Se normaliza a página vacía + toast `warning` con el mensaje literal de la API (regla 14).
Cualquier otro `4xx`/`5xx` → `error` y se propaga.

## Bug preservado del legado (no corregido, no lo pidió la HU)

`SP_INDICADOR_DROPSIZE` (y por ende `SP_V2_REPORTE_DROPSIZE`, que replica su lógica) tiene
un bug real en el tipo Producto: `dropSizeCantidad` ahí se calcula como `totalVentas /
totalProductos` (NO `totalProductos / totalClientes`, como en Global/Línea). El Front no lo
compensa ni lo señala visualmente — el dato llega tal cual de la API y se muestra igual que
cualquier otro valor de la columna (mismo criterio que la división entera preservada en
`dias_promedio_inventario`).

## Gotcha de tipos: `totalClientes`/`totalProductos` son `double`, no `int`

El backend confirmó que ambos campos son `double` en la API (el legado los calcula sumando
columnas `float`), aunque en la práctica casi siempre salen enteros. El Front los tipa como
`number` en `DropSizeItem` (ya era así desde FE-1) y los formatea con `number: '1.0-0'` en
la tabla — funciona igual con decimales o sin ellos, no requirió ajuste en FE-3/FE-4.

## Nota sobre FE-1/FE-2 → FE-3/FE-4

FE-1/FE-2 (otra corrida de agente) dejaron el componente con datos MOCK deterministas
(`buildMockData`/`buildMockItem`/`pseudoRandom`/`round2`) y paginación en cliente
(`paginarCliente`). FE-3/FE-4 reemplazó esa lógica 1:1 por el servicio HTTP real,
manteniendo nombres de métodos/propiedades (`buscar`, `limpiarFiltros`, `navegar`,
`onPerPage`, `exportar`, `pag`, `tipo`, `columnaCodigoBarras`, `displayedColumns`) — el
HTML no requirió ningún cambio.

Relacionado: [[modulo-reportes-dias-promedio-inventario]], [[modulo-reportes-margen-bruto]].
