---
name: modulo-produccion-agranel
description: Pantalla Producción a granel — listado del proceso + acciones operativas (agregar MPL, envasado, aprobar) de los WS móviles migrados
type: decision
---

# Módulo Producción a granel

Pantalla `admin/produccion-agranel` (`feature/produccion-agranel/`). Migra la vista legada
`ProduccionAgranel.cshtml` (listado del proceso con filtros usuario rol 13 / estatus / rango
de fechas) y, a diferencia de Producción Líquidos/Trapeadores (solo lectura), **agrega
acciones operativas** que en el legado solo existían en la app móvil admin:

- **Agregar a producción** (diálogo): producto MPL (línea 12) vía `app-select-paginado` con
  `ProductosService.listar({ idLineaProducto: 12 })` + cantidad + almacén →
  `POST /api/produccion-agranel`.
- **Registrar envasado** (diálogo): producto envasable reusando
  `RelacionLiquidosService.buscarProductos('envasar')` (regla 00, no se creó búsqueda nueva)
  → `POST /api/produccion-agranel/envasado`.
- **Aprobar** (acción de fila, solo estatus pendientes 1/2 — `ESTATUS_AGRANEL_PENDIENTES` en
  el modelo): cantidad atendida (max = solicitada) + observaciones →
  `PATCH /api/produccion-agranel/aprobar` con un solo renglón; el estatus final lo calcula la BD.

## Detalles no obvios
- Filtro usuario: rol 13 fijo (paridad con el legado `ObtenerUsuarios(idRol=13)`), sin cascada
  de rol como en produccion-liquidos. Catálogo de estatus propio
  (`ProduccionAgranelService.obtenerEstatus()`), es el único catálogo del servicio.
- Almacenes en diálogos: `UsuariosService.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID)`
  (regla 15, sucursal fija sin selector visible).
- Chip de estatus coloreado por `idEstatusProduccionAgranel` (regla 10); columna acciones
  `stickyEnd` con fix de fondo en el SCSS del componente.
- Gotcha del legado: `ProduccionAgranel.cshtml` referencia `EvtProcesoProduccionAgranel.js`,
  pero ese archivo contiene la lógica de *Relación Líquidos*; los callbacks reales de la
  pantalla viven en `evtReporteCostoProduccion.js`.
- Menú: ítem de nivel superior "Producción a granel" (ícono `flask`), antes de Producción
  líquidos. i18n `produccionAgranel` en es/en.
