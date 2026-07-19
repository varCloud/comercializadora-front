# Módulo Facturas Ventas (FE-1 a FE-4, `migracion_facturas_ventas`)

Pantalla `/admin/facturas`: listado paginado de facturas de venta (`api/facturas`) con acciones
por estatus — Facturada: Ver (`window.open(pathArchivoFactura)`) / Reenviar (diálogo) / Cancelar
(confirmación); Cancelada o Pendiente de cancelación: Consultar estatus. Migra
`Views/Factura/Facturas.cshtml` + `_ObtenerFacturas.cshtml` + `js/EvtFacturas.js`/`UtilsFactura.js`
del legado contra el contrato real cerrado por el bloque API.

## Catálogo de estatus sin endpoint dedicado → constante en `models/`
`EstatusFactura` es un enum fijo del back (Facturada/Cancelada/Error/PendienteDeCancelacion) sin
endpoint de catálogo propio. Se modeló como constante `ESTATUS_FACTURA_OPTIONS` (`Catalogo[]`) +
enum `EstatusFacturaId` en `admin/models/facturas/estatus-factura.ts`, en vez de hardcodear el
arreglo dentro del componente. Precedente para el próximo módulo que necesite un filtro de
catálogo fijo sin round-trip al servidor: ponerlo en `models/<feature>/`, no en el `.ts` de la
página.

## Total con impuestos: no se recalcula con una tasa fija
El diálogo de reenvío muestra subtotal = `DetalleVentaFactura.total` (sin IVA, viene del back) y
total = `montoTotal` de la fila del listado (con impuestos). El IVA mostrado es la diferencia
(`total - subtotal`), **no** `subtotal * 0.16` como hacía el legado (`js/EvtFacturas.js
modalFactura`) — evita asumir una tasa fija que no aplica a todos los conceptos/clientes.

## Encadenado Cancelar → Consultar estatus (paridad con el legado)
`CancelarFactura` del legado, tras cancelar con éxito, encadenaba automáticamente
`ActualizarEstatusCancelacionFactura` (consulta el acuse ante el SAT y lo muestra en un `swal`).
Se replicó igual: `FacturasListComponent.cancelar()` llama a `consultarEstatus()` tras un cancelar
exitoso, que muestra el acuse (estado/estatusCancelación/validaciónEFOS) y recarga el listado.

## Desajuste con el legado: "Consultar estatus" también en Cancelada
El legado (`_ObtenerFacturas.cshtml`) solo mostraba la acción "Consultar estatus" en estatus
Pendiente de cancelación (4). El tablero de tareas (orquestador) pidió mostrarla también en
Cancelada (2) — se implementó así por instrucción explícita, no es un descuido.

## Sin runtime verificado contra la API real
La API (`comercializadora-api`) no estaba levantada durante esta sesión (no se pudo conectar a
`https://localhost:7285`) y no hay herramienta de browser/E2E disponible en este entorno. Solo se
verificó `npm run build` (limpio, sin errores ni warnings nuevos). **Pendiente**: levantar la API
+ `npm start`, loguearse y ejercitar filtros/paginación/las 4 acciones contra datos reales antes
de aprobar el bloque Front (especialmente reenviar/cancelar/estatus, que dependen de config aún
pendiente en el back — ver `comercializadora-api/.claude/memory/modulo-facturacion-ventas.md`).

## Archivos
`admin/models/facturas/{factura-venta,estatus-factura,concepto-venta-factura,
detalle-venta-factura,reenviar-factura-request,cancelar-factura-request,
estatus-cancelacion-request,acuse-estatus-cfdi}.ts`, `admin/services/facturas.service.ts`,
`admin/feature/facturas/{facturas-routing.module.ts,pages/facturas-list/*,
components/reenviar-factura-dialog/*}`. Menú: `sidebar-evaluaciones-data.ts` (ícono
`file-invoice`). i18n: clave `facturas.*` en `es.json`/`en.json`. `npm run build` → 0 errores
(2026-07-15).

Relacionado: feature `bitacoras` (patrón de filtros estructurados + selector paginado de
usuario), feature `compras` (patrón Swal de confirmación) — ambas sin memoria dedicada propia.
[[modulo-facturas-pedidos-especiales]] — pantalla hermana (`idPedidoEspecial`), clonada en vez
de parametrizada por decisión del usuario; extiende este mismo `facturas.service.ts`.
