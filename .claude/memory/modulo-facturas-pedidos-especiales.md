# Módulo Facturas Pedidos Especiales (FE-1 a FE-3, `migracion_facturas_pedidos_esp`)

Pantalla **independiente** `/admin/facturas-pedidos-especiales` (hermana de Facturas Ventas,
ver `modulo-facturas-ventas.md`): mismas columnas/acciones por estatus, pero sobre
`idPedidoEspecial` contra las rutas propias `api/facturas/pedidos-especiales`. Migra
`Views/FacturaPedidosEspeciales/*.cshtml` + `js/EvtFacturasPedidosEspeciales.js` del legado.
Decisión explícita del usuario (HU): **no** parametrizar el componente de ventas para servir
ambas pantallas — se clonó.

## Qué se reutilizó vs. qué se clonó
- **Reutilizado tal cual** (sin cambios): `DetalleVentaFactura`/`DetalleVentaFacturaModel`
  (misma forma para el detalle de reenvío), `AcuseEstatusCfdi`, `EstatusCancelacionRequest`
  (`esPedidoEspecial` ya era un flag genérico), `EstatusFacturaId`/`ESTATUS_FACTURA_OPTIONS`
  (mismo enum de estatus del back para ambas pantallas), `FacturasService.consultarEstatusCancelacion`
  (mismo endpoint compartido `POST /api/facturas/estatus-cancelacion`).
- **Extendido** (mismo archivo, no un servicio nuevo): `facturas.service.ts` ganó
  `listarPE/irLinkPE/obtenerDetallePE/reenviarPE/cancelarPE` + `baseUriPe` (`baseUri +
  URIS_CONFIG.FACTURAS_PEDIDOS_ESPECIALES`). Un solo servicio para las dos pantallas hermanas,
  igual que el back tiene un solo `FacturasController` para ambos módulos.
- **Clonado** (archivos propios, no compartidos): modelos con identificador propio
  (`factura-pedido-especial.ts`, `reenviar-factura-pe-request.ts`, `cancelar-factura-pe-request.ts`),
  componente `facturas-pe-list` y diálogo `reenviar-factura-pe-dialog` — copias de
  `facturas-list`/`reenviar-factura-dialog` con `idPedidoEspecial` en vez de `idVenta` y las
  llamadas `*PE` del servicio. Se prefirió la duplicación explícita (~150 líneas) sobre
  parametrizar un componente compartido, por instrucción directa del usuario.

## `estatus-cancelacion` es el único endpoint verdaderamente compartido
A diferencia de listar/detalle/reenviar/cancelar (rutas PE propias bajo
`/pedidos-especiales/...`), `POST /api/facturas/estatus-cancelacion` nació compartido con flag
`esPedidoEspecial` desde la feature 1. El front de PE llama exactamente el mismo método de
`FacturasService` que ventas, solo cambiando `esPedidoEspecial: true` e `id: idPedidoEspecial`.

## Ícono de menú distinto para diferenciar de Ventas
"Facturas Ventas" usa `file-invoice`; "Facturas Pedidos Esp" usa **`file-star`** (ambos íconos
Tabler reales, verificados en el paquete `angular-tabler-icons/icons`) para que se distingan a
simple vista en el sidebar pese a ser pantallas gemelas.

## Sin runtime verificado contra la API real
Igual que en `migracion_facturas_ventas`: la API no estaba levantada en la sesión y no hay
herramienta de browser/E2E en este entorno. Solo se verificó `npm run build` (limpio). Pendiente
manual: levantar API + `npm start`, loguearse y ejercitar filtros/paginación/las 4 acciones contra
datos reales (reenviar/cancelar/estatus heredan los mismos pendientes de configuración del back:
CSD, `FacturacionArchivos:*`, SMTP, URLs del PAC).

## Archivos
Nuevos: `admin/models/facturas/{factura-pedido-especial,reenviar-factura-pe-request,
cancelar-factura-pe-request}.ts`, `admin/feature/facturas-pedidos-especiales/
{facturas-pedidos-especiales-routing.module.ts,pages/facturas-pe-list/*,
components/reenviar-factura-pe-dialog/*}`. Modificados: `admin/services/facturas.service.ts`
(+5 métodos PE), `config/uris-config.ts` (+`FACTURAS_PEDIDOS_ESPECIALES`),
`admin/admin-routing.module.ts` (+ruta), `sidebar-evaluaciones-data.ts` (+entrada). i18n: clave
`facturasPe.*` en `es.json`/`en.json`. `npm run build` → 0 errores (2026-07-15).

Relacionado: [[modulo-facturas-ventas]] (pantalla hermana, mismo patrón de acciones/diálogo/IVA).
