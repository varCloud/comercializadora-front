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

## Fase 2 (pendiente, NO implementada)
Lista "Ventas de Estaciones"; Top Clientes/Productos/Proveedores con selector de periodo;
series temporales de merma/costo. Los endpoints de API (`top-ten`, `informacion-global`,
`iva-acumulado`) ya existen.
</content>
