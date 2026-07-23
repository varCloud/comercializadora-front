---
name: modulo-reportes-devoluciones-proveedor
description: Reportes > Devoluciones a Proveedor — FE-1..FE-4 completas, 10º sub-reporte; servicio HTTP real + paginación server-side + export CSV dual; sin desajustes mock vs. contrato real
type: project
---

# Módulo Reportes > Devoluciones a Proveedor (FE-1..FE-4 completas)

10º sub-reporte del módulo "Reportes" (2026-07-23). Migra
`ReportesController.DevolucionesProveedor/ObtenerDevolucionesProveedor` del legado.
FE-1/FE-2 (modelos + pantalla MOCK) corrieron mientras el backend avanzaba en paralelo en
`comercializadora-api`; FE-3 (servicio HTTP) y FE-4 (integración real) se completaron una vez
aprobado el backend, contrato verificado en `task_reporte_devoluciones_proveedor.md`.

## Archivos

- `admin/models/reportes-devoluciones-proveedor/` — `DevolucionProveedorItem`/Model
  (`idDevolucion`, `fecha`, `idCompra`, `idProducto`, `codigoBarras`, `descripcionLinea`,
  `descripcion`, `cantidad`, `cantidadRecibida`, `cantidadDevuelta`, `observaciones` [motivo],
  `idUsuario`, `nombreUsuario`, `idProveedor`, `nombreProveedor`);
  `DevolucionProveedorSearchParams`/Model (`idProveedor?`, `fechaIni?`, `fechaFin?`, `page?`,
  `perPage?`).
- `admin/services/reportes-devoluciones-proveedor.service.ts` — `ReportesDevolucionesProveedorService`.
- `admin/feature/reportes/devoluciones-proveedor/` — routing propio +
  `pages/devoluciones-proveedor-list/{.ts,.html}` (ahora con servicio HTTP real).
- Ruta `reportes/devoluciones-proveedor` en `admin-routing.module.ts`; entrada en
  `navItemsApp`/`sidebar-evaluaciones-data.ts` (ícono `transfer-in`).
- i18n: `reportesDevolucionesProveedor.*` en `es.json`/`en.json`.

## FE-3/FE-4 (servicio real + integración)

- **Sin desajustes** entre el mock de FE-2 y el contrato real: los nombres/tipos de
  `DevolucionProveedorItem`/`DevolucionProveedorSearchParams` (`admin/models/reportes-devoluciones-proveedor/`)
  ya coincidían 1:1 con la respuesta real documentada. No se tocaron esos modelos.
- **`ReportesDevolucionesProveedorService`** (`admin/services/reportes-devoluciones-proveedor.service.ts`):
  mismo patrón que `ReportesNivelServicioProveedorService` (hermano más cercano: filtros todos
  opcionales, **sin** quirk de `estatus:-1`/`400` — a diferencia de `drop_size`/`margen_bruto`).
  `listar`/`irLink` (paginado server-side, `mapPage` → `PagedResult<T>`) + `exportarCSV` (dual
  descarga inmediata / diferido por correo, sniff de `Content-Type` sobre blob, idéntico a los
  demás hermanos de Reportes).
- Nueva entrada `REPORTE_DEVOLUCIONES_PROVEEDOR: 'devoluciones-proveedor'` en `uris-config.ts`.
- **`DevolucionesProveedorListComponent`**: se sustituyó `mockData`/`filteredData`/`filtrarMock`/
  `buildMockData`/`buildMockItem`/`pseudoRandom`/`buildCsv`/`descargarCsv` por llamadas reales al
  servicio (`listar`/`irLink`/`exportarCSV`) con `finalize()` + `NotificationService`. Se
  mantuvieron **intactos** los nombres públicos (`buscar`, `limpiarFiltros`, `navegar`,
  `onPerPage`, `exportar`, `pag`, `displayedColumns`, `fetchProveedores`) — el HTML no requirió
  ningún cambio.
- `npm run build` sin errores (solo warnings preexistentes de Sass `@import` deprecado y
  CommonJS `jsbarcode`/`qrcode`, no relacionados con esta feature).

## Decisiones / desvíos respecto a los hermanos

- **Rango de fechas: default hoy/hoy ESTÁNDAR (regla 18, SIN excepción)** — a diferencia de
  `nivel_servicio_proveedor` (rango opcional sin default, excepción documentada). Aquí es la
  HU la que pidió explícitamente el default estándar, sin excepción alguna.
- **Selector Proveedor** vía `app-select-paginado` (regla 16, ~153 proveedores reales):
  reutiliza `ProveedoresService.buscarPaginado` — el mismo `fetchPage` que ya consumen
  `compras-list`/`compra-form-dialog`. No se duplicó el catálogo.
- **Sin quirk de negocio bajo `400`** para este endpoint (a diferencia de
  `margen_bruto`/`drop_size`): `listar()`/`irLink()` no interceptan errores, se propagan tal
  cual (mismo criterio que `nivel_servicio_proveedor`).
- **"Motivo Devolución" (`observaciones`)**: el backend ya aprobado expone el campo tal cual
  el contrato documentado (`DevolucionProveedorItem.observaciones`); no requirió tratamiento
  especial adicional en el front.
- Nombres de métodos/propiedades se mantuvieron estables desde FE-2 (`buscar`, `limpiarFiltros`,
  `navegar`, `onPerPage`, `exportar`, `pag`, `displayedColumns`, `fetchProveedores`): FE-4 los
  sustituyó 1:1 sin tocar el HTML — mismo patrón ya usado en `reporte_drop_size`.

## Revisión (revisor-frontend) — regla 13 (buscador), decisión explícita del usuario

`revisor-frontend` marcó como **bloqueante** la falta de un buscador de texto libre (regla 13):
el filtro disponible es solo Proveedor + rango de fechas, sin `@search`. La HU no lo pidió
explícitamente (documentado también en `task_reporte_devoluciones_proveedor.md`). El mismo
hueco ya existe, **aceptado como no bloqueante**, en `nivel_servicio_proveedor` (dos revisores
distintos calificaron el mismo tipo de hallazgo de forma inconsistente).

**Decisión del usuario (2026-07-23):** tratarlo como no bloqueante aquí también, por
consistencia con el resto de la serie de sub-reportes de Reportes. Se documentó la excepción
en la regla del repo: [`13-busqueda-listados.md`](../rules/13-busqueda-listados.md#excepción--sub-reportes-de-solo-consulta-en-reportes)
("sub-reportes de solo consulta en `Reportes/` cuyo filtro principal ya acota el dataset
— Proveedor + rango de fechas, etc. — no requieren buscador de texto libre salvo que la HU lo
pida"). Aplica hoy a `nivel-servicio-proveedor` y `devoluciones-proveedor`; si un sub-reporte
futuro sí necesita búsqueda de texto libre, se implementa normal (no es un veto).

Relacionado: [[modulo-reportes-nivel-servicio-proveedor]], [[modulo-reportes-drop-size]].
