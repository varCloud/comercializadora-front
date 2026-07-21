---
name: modulo-reportes-margen-bruto
description: Feature Reportes > Margen Bruto completa (API+Front); paginación server-side (rompe el patrón cliente de los hermanos), rango de fechas obligatorio (excepción a regla 18), quirk de la API "sin ventas" = 400 con estatus:-1
type: project
---

# Módulo Reportes > Margen Bruto

Octava sub-feature del módulo "Reportes" (2026-07-21). Migra
`ReportesController.MargenBruto/BuscarMargenBruto` del legado (`SP_INDICADOR_MARGEN_BRUTO`).
FE-1..FE-4 completos (API-1..API-4 ya aprobados previamente, commit `a8efb5e`). Build
(`npm run build`) verificado; **sin smoke test en runtime** (API no estaba levantada en la
sesión de FE-3/FE-4).

## Archivos
- `admin/models/reportes-margen-bruto/` — `MargenBrutoItem`/`MargenBrutoItemModel` (`id`,
  `descripcion`, `totalVentas`, `costoVentas`, `contribucionMarginal`, `margenBruto`,
  `codigoBarras?`); `TipoMargenBrutoId` (enum Global=1/Linea=2/Producto=3/VentaProducto=4) +
  `TIPO_MARGEN_BRUTO_OPTIONS` (catálogo fijo, mismo patrón que `reportes-devolucion/tipo-ticket`)
  + `TIPOS_MARGEN_BRUTO_CON_CODIGO_BARRAS`; `MargenBrutoSearchParams`/`Model` (`tipo`, `fechaIni`,
  `fechaFin` **obligatorios sin `?`**, `page`/`perPage` opcionales).
- `admin/feature/reportes/margen-bruto/` — `margen-bruto-reportes-routing.module.ts` +
  `pages/margen-bruto-list/margen-bruto-list.component.{ts,html}` (`MargenBrutoListComponent`).
- Ruta `reportes/margen-bruto` en `admin-routing.module.ts`; entrada "Margen Bruto" (ícono
  `chart-infographic`) en `navItemsApp` bajo Reportes.
- i18n: `reportesMargenBruto.*` en `es.json`/`en.json`.
- `admin/services/reportes-margen-bruto.service.ts` — `ReportesMargenBrutoService` (FE-3):
  `listar(filtros)`, `irLink(url)`, `exportarCSV(filtros)`.

## Decisiones / desvíos
- **Ubicación de modelos:** el enunciado de la tarea decía `admin/models/reportes/margen-bruto/`
  pero se creó en `admin/models/reportes-margen-bruto/` — convención real de **todos** los
  hermanos ya migrados (`reportes-inventario`, `reportes-ventas`, `reportes-merma`,
  `reportes-devolucion`, `reportes-compras`, `reportes-cierres`, `reportes-cierres-pe`). Se
  prioriza consistencia del repo (regla 00/11) sobre el texto literal de la tarea.
- **Paginación server-side para los 4 tipos** (decisión de HU, ver `hu_reporte_margen_bruto.md`):
  rompe el patrón de paginación-en-cliente de los reportes hermanos (Cierres/Cierres PE/Ventas
  con `paginarCliente`), justificado por volumen real en BD (`Venta_Producto` sin filtro ≈ 3.6M
  filas). Cuando FE-3/FE-4 conecten el servicio real, `Paginador<T>`/`app-paginador` seguirán
  igual — solo cambia si `cargar()`/`navegar()` llaman `paginarCliente` (mock) o
  `service.listar()`/`irLink()` (real, con `links`/`meta` del back).
- **Rango de fechas OBLIGATORIO** (excepción documentada a la regla 18 estándar): sin default
  hoy/hoy, arranca `null`/`null` con `Validators.required`; "Buscar"/"Exportar" deshabilitados
  mientras el rango sea inválido. Motivo: la futura API rechaza con 400 si falta alguna fecha, y
  paginar sin fecha en `Venta_Producto` seguiría permitiendo un `COUNT` sobre ~3.6M filas.
- Selector "Tipo" = `mat-select` (4 opciones ≤10, regla 16), catálogo hardcodeado en TS con
  labels en español directo (no i18n keys) — mismo precedente que `TIPO_TICKET_OPTIONS`.
- **Nombre del servicio (FE-3):** `admin/services/reportes-margen-bruto.service.ts` /
  `ReportesMargenBrutoService`, NO el literal `margen-bruto.service.ts` de la tarea — sigue el
  prefijo `Reportes<Feature>Service` de `ReportesDevolucionService`/`ReportesCierresPEService`.
  Mismo criterio de desvío ya aplicado a la ubicación de modelos en FE-1.

## Hallazgo — quirk de la API: "sin ventas" viaja como `400` con `estatus:-1` (no `200` vacío)

A diferencia de la mayoría de reportes (donde "sin resultados" es un `200` con `modelo:[]`),
aquí el repositorio envuelve el caso "sin ventas en el rango" en un `Notificacion<RawPage<T>>`
que responde HTTP **400** con `estatus:-1` en el body — el mismo código HTTP que usa la
validación real de parámetros obligatorios (`estatus:400` para "falta fechaIni", etc.). El Front
NO puede confiar solo en el status code para distinguir "sin resultados" de "solicitud inválida".

**Solución aplicada en `ReportesMargenBrutoService`:** el propio servicio captura el error
(`catchError`) en `listar()`/`irLink()`/`exportarCSV()`, inspecciona `err.error?.estatus`:
- `estatus === -1` → se trata como resultado válido sin filas: para el listado resuelve
  `of({data:[], links:EMPTY_LINKS, meta:EMPTY_META})` y notifica `warning` con el mensaje
  literal de la API (regla 14); para exportar, notifica `warning` pero sigue propagando el error
  (no hay archivo que descargar).
- cualquier otro caso → notifica `error` y propaga (`throwError`).

**Consecuencia de diseño:** a diferencia de `ReportesDevolucionService.listar` (que NO captura
errores — deja que el componente notifique en su `subscribe({error})`), aquí la notificación se
centralizó en el servicio porque es el único lugar que puede inspeccionar `err.error.estatus`
antes de decidir si es un error real. El componente (`MargenBrutoListComponent`) solo hace
`console.error` en sus callbacks de error para no duplicar el toast. **Si se repite este patrón
en otro reporte**, replicar esta decisión (notificar en el servicio, no en el componente) en vez
de mezclar ambos estilos en la misma feature.

**Paginación server-side real:** `navegar(url)` llama a `service.irLink(url)` (URL real de los
`links`); `onPerPage(perPage)` actualiza `pag.meta` y vuelve a llamar `buscar()` desde la página 1
— reemplazó por completo el `paginarCliente()` del mock de FE-2 (ver nota de esa versión más
abajo, ya superada).

**Exportar con envío diferido:** mismo patrón dual ya usado en `ReportesDevolucionService`/
`ReportesMermaService` (sniff de `Content-Type` sobre blob). Se descartó el `notify('success')`
que tenía el mock de FE-2 tras una descarga inmediata — los servicios reales ya migrados no
notifican éxito ahí (solo diferido=`info` y error=`error`), se siguió esa convención por
consistencia. La clave i18n `reportesMargenBruto.msg.exportOk` quedó sin uso.

Relacionado: [[modulo-reportes-cierres-pe]], [[modulo-reportes-inventario]],
[[exportacion-descarga-vs-diferido-front]].
