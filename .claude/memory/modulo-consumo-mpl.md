---
name: modulo-consumo-mpl
description: Pantalla "Consumo de MPL" (Costo de Producción Agranel) — reporte de solo lectura con filtros cascada Año→Mes y Almacén→Línea; sin request-model propio (se usa ListarParams); selectores ng-select por precedente real de código
type: decision
---

# Módulo Consumo de MPL

Pantalla `admin/consumo-mpl` (`feature/consumo-mpl/`). Migra
`Views/Reportes/CostoProduccionAgranel.cshtml` + `_ObtenerCostoProduccion.cshtml`: reporte de
solo lectura (sin altas/ediciones/exportar) con filtros cascada **Año→Mes** y **Almacén→Línea de
producto** + buscador de producto (regla 13). Pantalla **distinta** de "Producción a granel"
([[modulo-produccion-agranel]]); comparten dominio (conversión MPL) pero son vistas legadas
independientes.

## Archivos
- `admin/models/consumo-mpl/costo-produccion-agranel.ts` (`CostoProduccionAgranel`/
  `CostoProduccionAgranelModel`, 9 campos exactos del contrato de API).
- `admin/services/consumo-mpl.service.ts` (`listar`, `irLink`, `obtenerAnios`, `obtenerMeses`).
- `admin/feature/consumo-mpl/` (routing + `pages/consumo-mpl-list/`).
- `config/uris-config.ts`: segmento `CONSUMO_MPL: 'consumo-mpl'`.
- i18n `consumoMpl.*` en `es.json`/`en.json`.
- Ruta `consumo-mpl` en `admin-routing.module.ts`; menú en `sidebar-evaluaciones-data.ts`
  (ícono Tabler `report-analytics`, después de "Producción a granel").

## "Cantidad Restante" — getter derivado, no viaja de la API
Confirmado con la API/BD (ver memoria del repo backend `modulo-consumo-mpl`): el SP no devuelve
esa columna. Se calcula en `CostoProduccionAgranelModel` como **getter**
(`cantidadRestanteMesAnt = cantidadSolicitadaMesAnt - cantidadAceptadaFinalMesAnt`), mismo
patrón que `esPendiente` en `ProcesoProduccionAgranelModel` (regla 09: la interfaz solo declara
los campos reales del contrato JSON; el derivado vive en la clase).

## Desviación respecto al plan original (FE-1): sin "request de listado" propio
El plan sugería un modelo de request de listado dedicado. Al revisar el código real de
`produccion-agranel`/`limites-inventario`, **ninguna feature de listado tiene ese modelo**: usan
el `ListarParams` genérico (`admin/models/shared/listar-params.ts`, con índice `[extra: string]`)
más un objeto de filtros armado ad-hoc en el componente (`{ anioCalculo, mesCalculo, idAlmacen,
idLineaProducto, q }`) que se pasa a `service.listar({ ...filtros, page, perPage })`. Se siguió
ese patrón real (regla 00: no crear algo que ya existe en forma genérica) en vez de crear un
modelo nuevo que hubiera sido una envoltura redundante sobre `ListarParams`.

## Catálogos: reuso directo en el componente, sin proxy en ConsumoMplService
`ConsumoMplService` solo expone lo propio del reporte (`listar`/`irLink`/`obtenerAnios`/
`obtenerMeses`). Los catálogos de **Almacén** y **Línea** NO se duplican ahí (regla 00): el
componente inyecta `UsuariosService.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID)` (ruta real
`GET /api/usuarios/catalogos/almacenes`, sucursal fija Uruapan, regla 15 — sin selector de
sucursal visible) y `ProductosService.obtenerLineas(idAlmacen?)` directo, mismo criterio que
`produccion-agranel` (que inyecta `UsuariosService` en sus diálogos en vez de proxyarlo).

### Extensión de `ProductosService.obtenerLineas`
Se agregó el parámetro opcional `idAlmacen?: number` (antes sin parámetros) para soportar la
cascada Almacén→Línea (`GET /api/productos/catalogos/lineas?idAlmacen=`, 0/ausente = todas). Se
verificó con grep los 4 call-sites existentes (`limites-inventario-list`,
`ajuste-inventario-fisico-dialog`, `codigos-barras`, `producto-form-dialog`) — todos llaman sin
argumento, siguen compilando igual (retrocompatible). También se extendió el `obtenerCatalogo`
privado del servicio para aceptar `HttpParams` opcionales (mismo patrón que ya tenía
`limites-inventario.service.ts`).

## Selectores (regla 16): decisión final por catálogo
- **Año** → `mat-select`. Confirmado en BD (según doc de tareas del back): 2020-2026 desc = 7
  opciones, ≤10.
- **Mes** → `ng-select`. Es un catálogo derivado nuevo (primero de su tipo en el repo, sin
  precedente de selector de mes); el peor caso es el año completo = 12 meses, que excede el
  umbral de 10 de la regla 16 (cae en el bucket 11–25).
- **Almacén** y **Línea de producto** → `ng-select`. No se pudo consultar el conteo real en BD
  desde esta sesión (sin acceso a base de datos), así que se siguió el **precedente de código
  real** más cercano: `limites-inventario-list.component.html` usa `ng-select` para ambos
  catálogos (Almacén/Línea), igual que `producto-form-dialog`/`ajuste-inventario-fisico-dialog`
  para Línea. Se prefirió replicar ese patrón consistente en vez de asumir `mat-select` por
  "catálogo chico" sin evidencia. Si en el futuro se confirma que Almacén tiene ≤10 opciones
  reales, se podría bajar a `mat-select` por consistencia con la regla, pero no se cambió aquí
  sin evidencia.

## Deuda técnica documentada (fuera de alcance de esta feature — NO se refactorizó)
Existen **varios servicios con métodos `obtenerAlmacenes`/`obtenerLineas` casi duplicados**
(violación acumulada de la regla 00 en features previas):
- `obtenerAlmacenes`: `usuarios.service.ts`, `limites-inventario.service.ts`,
  `compras.service.ts` (sin `idSucursal`), `ubicaciones.service.ts`, `estaciones.service.ts`.
- `obtenerLineas`: `productos.service.ts` (ahora extendido con `idAlmacen?`),
  `limites-inventario.service.ts` (sin parámetros).

Se detectó al confirmar cuál reusar para esta feature (se optó por `UsuariosService`/
`ProductosService`, los "dueños" naturales del dominio). Consolidar estos catálogos en un solo
servicio compartido (p. ej. `admin/services/catalogos.service.ts` o extender
`ProductosService`/`UsuariosService` como fuente única y que el resto delegue) queda pendiente
como refactor futuro, no se tocó en esta sesión para no ampliar el alcance.

## Build
`npm run build` → 0 errores (2026-07-05), solo warnings preexistentes ajenos a esta feature
(NG8113 de componentes demo, deprecación `@import` de Sass, CommonJS de `jsbarcode`/`qrcode`).

Relacionado: [[modulo-produccion-agranel]], [[modulo-produccion-liquidos]].
