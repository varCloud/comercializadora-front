# Módulo Dashboard (comercializadora-front) — Fase 1

Segundo feature de producto. Página de inicio del panel. Fecha: 2026-06-20.

## Qué se entregó (Fase 1)
- Página standalone `admin/feature/dashboard/pages/dashboard/` (signals + control flow nativo),
  ruta `/admin/dashboard`, cargada con `loadComponent` desde `dashboard-routing.module.ts`.
- **Tarjetas KPI**: ventas día/sem/mes/año, info global (id!=1), merma actual/anterior y
  costo de producción actual/anterior.
- **Gráfica "Ventas por fecha"** con `ng-apexcharts` (columnas), series Ventas/Ventas PE,
  selector de periodo `mat-button-toggle-group` (1=Semana,2=Mes,3=Año).
- **Drilldown on-click**: evento ApexCharts `chart.events.dataPointSelection` → toma la
  categoría clicada (su fechaIni/fechaFin) y llama `obtenerVentasPorEstacion`; pinta el
  desglose por estación en una segunda card (barras horizontales).
- Servicio `admin/services/dashboard.service.ts` (regla 02; `environment.BASE_URL_ADMIN` +
  `URIS_CONFIG.DASHBOARD`). Modelos en `admin/models/dashboard/` (interface + Model, reglas 9/11).
- i18n `dashboard.*` en `es.json`/`en.json`. CSS mínimo.

## Landing
`admin-routing.module.ts`: redirect `{ path: '', redirectTo: 'dashboard', pathMatch: 'full' }`
dentro de `AdminComponent`, así `/admin` cae en el dashboard tras login. Menú: item "Dashboard"
(icono `layout-dashboard`, route `/admin/dashboard`) en `navItemsApp`. **Reversible.**

## Gotcha: pipes en componentes standalone
`| currency` y `| number` requieren importar **explícitamente** `CurrencyPipe`/`DecimalPipe`
desde `@angular/common` en los `imports` del componente standalone (no llegan por
`MaterialModule`). Sin ese import el build falla.

## Fase 2 — implementada (ver `feature/reporte_...` no aplica; entró vía auditoría de paridad)
Lista "Ventas de Estaciones" y Top Clientes/Productos/Proveedores con selector de periodo:
**implementadas** (confirmado en runtime, auditoría de paridad `dashboard` 2026-08-24). Series
temporales de merma/costo: siguen sin implementar.

## Corrección 2026-08-24 (auditoría de paridad P-01): gráfica de IVA acumulado
El endpoint `iva-acumulado` **no era código muerto del legado** (afirmación previa incorrecta,
heredada de la HU): el legado renderiza un segundo gráfico ("IVA COBRADO DE VENTAS & PEDIDOS
ESPECIALES") junto al de "Ventas por fecha". Se agregó `obtenerIvaAcumulado` al servicio y un
segundo `apx-chart` (columna única, serie "IVA Acumulado" = `total + totalPE` por categoría) en
una segunda columna dentro de la misma card, reusando el selector de periodo existente.
</content>
