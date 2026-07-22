---
name: modulo-reportes-dias-promedio-inventario
description: Feature Reportes > Días Promedio Inventario completa (API+Front); paginación server-side (3 tipos), rango de fechas OPCIONAL (regla 18 estándar, a diferencia de margen_bruto), quirks -400/-1 del backend
type: project
---

# Módulo Reportes > Días Promedio Inventario

Séptimo sub-reporte del módulo "Reportes" (2026-07-21). Migra
`ReportesController.DiasPromedioInventario/ObtenerDiasPromedioInventario` del legado
(`SP_INDICADOR_DIAS_PROMEDIO_INVENTARIO`). FE-1..FE-4 completos, build (`npm run build`)
verificado. Commit `3b6c213` en `eva`.

## Archivos
- `admin/models/reportes-dias-promedio-inventario/` — `DiasPromedioInventarioItem`/Model
  (`id`, `descripcion`, `costoProducto`, `inventarioPromedioPeriodo`, `costoInvPromedio`,
  `diasPeriodo`, `costoVendido`, `diasPromedioInventario`, `rotacionInventario`,
  `codigoBarras?`); `TipoDiasPromedioInventarioId` (enum Global=1/Línea=2/Producto=3 — el
  valor legado `4=productoVenta` es código muerto, NO se migró) + opciones de catálogo +
  set de tipos con código de barras; `DiasPromedioInventarioSearchParams`/Model (fechas
  **opcionales**, a diferencia de margen_bruto).
- `admin/feature/reportes/dias-promedio-inventario/` — routing +
  `pages/dias-promedio-inventario-list/{.ts,.html}`.
- Ruta `reportes/dias-promedio-inventario` en `admin-routing.module.ts`; entrada en
  `navItemsApp`/`sidebar-evaluaciones-data.ts` (ícono `rotate-clockwise-2`).
- i18n: `reportesDiasPromedioInventario.*` en `es.json`/`en.json` (41 claves).
- `admin/services/reportes-dias-promedio-inventario.service.ts` —
  `ReportesDiasPromedioInventarioService`: `listar(filtros)`, `irLink(url)`,
  `exportarCSV(filtros)`. Entrada `REPORTE_DIAS_PROMEDIO_INVENTARIO` en `uris-config.ts`.

## Decisiones / desvíos respecto al patrón margen_bruto (su hermano más cercano)

- **Rango de fechas OPCIONAL** (regla 18 estándar, default hoy/hoy, sin
  `Validators.required`): a diferencia de margen_bruto, el SP legado defaultea a
  `dbo.FechaActual()` si no se envían fechas, y el volumen máximo aquí está acotado por
  catálogo (~2,032 productos), no por ventas históricas — no había razón de negocio para
  forzar el rango.
- **Solo 3 tipos** en el selector (Global/Línea/Producto) — no hay "Venta_Producto" como en
  margen_bruto.
- **Paginación server-side** pese al volumen bajo — decisión explícita documentada en la HU
  (consistencia con margen_bruto), no por necesidad real de performance como en ese caso.
- Ubicación de modelos/servicio sigue la convención plana `reportes-<feature>/` (igual
  criterio que margen_bruto y el resto de hermanos).

## Hallazgo — quirk de la API: DOS códigos de negocio viajan como HTTP 400

A diferencia de margen_bruto (un solo caso `estatus:-1`), aquí hay **dos** motivos de
negocio que responden HTTP 400 desde el mismo endpoint:
- `estatus:-400` — el rango de fechas pedido excede el límite defensivo de **365 días**
  (guardrail nuevo, no existe en el legado — ver HU y memoria del API
  `modulo-reportes-dias-promedio-inventario.md`).
- `estatus:-1` — el backfill no pudo completarse / no hay datos para calcular con esos
  términos de búsqueda (mismo mensaje que el legado).

**Solución aplicada en `ReportesDiasPromedioInventarioService`:** mismo patrón que
`ReportesMargenBrutoService` — el servicio captura el error en `listar()`/`irLink()`/
`exportarCSV()`, inspecciona `err.error?.estatus`. Ambos códigos negativos (`-400` y `-1`)
se tratan igual: se normalizan a página vacía + toast `warning` con el mensaje literal de
la API (regla 14). Cualquier otro caso → `error` y se propaga. **Si se repite este patrón
en otro reporte con más de un código de negocio bajo el mismo HTTP status, seguir tratando
todos los `estatus` negativos "de negocio" (no técnicos) de forma uniforme**, en vez de
distinguir por valor exacto — el mensaje de la API ya es lo bastante específico para el
usuario.

## Hallazgo del lado API que afecta al Front (para awareness, no requiere cambio de UI)

El backend documentó que un backfill de solo 2 días agotó el `CommandTimeout` default de
Dapper (30s) — mitigado subiendo el timeout a 180s en el repositorio del API. Desde el
Front esto significa que una búsqueda con muchos días faltantes por precalcular puede
tardar bastante (hasta ~180s antes de que la API responda o falle). El `ng-block-ui` ya
cubre el loading visual mientras tanto; no se agregó ningún timeout/cancelación adicional
en el HttpClient del Front para esta feature — si se vuelve un problema recurrente en
producción, considerar agregar un mensaje de "esto puede tardar" en el UI para rangos
amplios.

Relacionado: [[modulo-reportes-margen-bruto]].
