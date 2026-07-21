---
name: modulo-reportes-cierres-pe
description: Feature Reportes > Cierres de Pedidos Especiales (FE-2/FE-3/FE-4); hermana de Cierres de Caja sin filtro de Almacén
type: project
---

# Módulo Reportes > Cierres de Pedidos Especiales

Séptima sub-feature del módulo "Reportes" (2026-07-21), hermana de "Cierres de Caja"
(`admin/feature/reportes/cierres/`). Migra `ReportesController.ConsultaCierresPedidosEspeciales`
del legado (`SP_REPORTE_CIERRES_PEDIDOS_ESPECIALES`, sin `SP_V2_*`).

## Archivos
- `admin/models/reportes-cierres-pe/` — `CierrePedidosEspeciales`/`CierrePedidosEspecialesModel`
  (20 campos) + `CierrePedidosPESearchParams`/`Model` (`idUsuario`, `fechaIni`, `fechaFin`).
- `admin/services/reportes-cierres-pe.service.ts` — `ReportesCierresPEService` (`getCierres`,
  `searchCierres`, `exportarCSV`), mismo patrón que `ReportesCierresService`.
- `admin/feature/reportes/cierres-pe/` — `cierres-pe-reportes-routing.module.ts` +
  `pages/cierre-pe-list/cierre-pe-list.component.{ts,html}` (`CierrePEListComponent`).
- Ruta `reportes/cierres-pe` en `admin-routing.module.ts`; entrada "Cierres Pedidos Especiales"
  (ícono `cash-banknote`) en `navItemsApp` bajo la sección Reportes.
- i18n: `reportesCierresPE.*` en `es.json`/`en.json`.

## Decisiones
- **Sin `idAlmacen`** (a diferencia de Cierres de Caja): no existe en el legado de Pedidos
  Especiales, decisión ya tomada en la HU.
- **Sin paginación server-side**: el SP devuelve un solo resultset; se pagina en cliente con
  `paginarCliente` (regla 10, "último recurso"), igual que Cierres de Caja.
- **Selector Usuario = `app-select-paginado`** reusando `UsuariosService.buscarPaginado` (regla
  16, >25 usuarios), consistente con Cierres de Caja/Ventas/Merma/Devoluciones — no se introdujo
  un `mat-select`/`ng-select` distinto solo para esta pantalla.
- Tabla con las 20 columnas de `CierrePedidosEspeciales` (incluye `idCierrePedidoEspecial`, a
  diferencia de Cierres de Caja que omite el id de la fila).

`npm run build` sin errores tras el cambio.

Relacionado: [[modulo-reportes-inventario]].
