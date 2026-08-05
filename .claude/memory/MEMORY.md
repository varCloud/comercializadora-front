# Memoria del proyecto — comercializadora-front

Índice de memoria versionada del proyecto. Una línea por memoria.
Lee este índice al iniciar una sesión. Al guardar una memoria nueva, crea un archivo
en esta carpeta y agrega aquí su puntero.

Tipos: `project` (trabajo/objetivos/restricciones), `decision` (decisiones de arquitectura
o convención), `reference` (recursos externos: URLs, dashboards, tickets), `gotcha`
(detalles no obvios / trampas).

## Memorias

- [Origen y naming del proyecto](origen-proyecto.md) — plantilla Modernize reutilizada; naming heredado de "evaluaciones".
- [Arquitectura mixta NgModules + standalone](arquitectura-mixta.md) — cuándo usar cada patrón.
- [Autenticación por token](auth-token.md) — JWT en localStorage, interceptor y guard.
- [Regla: reuso de componentes y CSS mínimo](regla-reuso-y-css-minimo.md) — reutilizar antes de crear; mínimo CSS usando utilidades globales.
- [PENDIENTE: URLs del backend](pendiente-urls-backend.md) — repuntar environments al backend comercializadora-lluvia (faltan URLs).
- [Paleta de marca](paleta-marca.md) — color principal #a6ce3a (verde Lluvia) + accent azul; dónde se define y el logo.
- [Flujo de agentes](flujo-agentes.md) — describir agentes en docs/agentes/<tema>/ antes de invocarlos.
- [Subagentes de migración](subagentes-migracion.md) — `.claude/agents/`: migrador-pantalla → revisor-frontend.
- [Login con JWT migrado](login-jwt-migrado.md) — el login consume la API nueva (usuario/contrasena + JWT); contrato y storage.
- [SesionService](sesion-service.md) — sesión centralizada con signals; no usar localStorage directo.
- [Sin residuo BodyBooster](sin-residuo-bodybooster.md) — eliminar (no adaptar) todo lo de atleta/creador/BodyBooster.
- [Módulo Usuarios](modulo-usuarios.md) — primer feature de producto; fijó reglas 10-14 (tablas/modelos por feature/modales/búsqueda/i18n).
- [Notificaciones e idioma](notificaciones-e-idioma.md) — toasts con ngx-toastr vía NotificationService; idioma default es + selector en header.
- [Módulo Dashboard (Fase 1)](modulo-dashboard.md) — landing /admin/dashboard; KPIs + gráfica ventas-por-fecha (ng-apexcharts) con drilldown on-click; gotcha pipes standalone (CurrencyPipe/DecimalPipe).
- [Submenú Líneas de producto](submenu-lineas-producto.md) — CRUD bajo Productos; primer uso de NavItem.children (grupo desplegable Productos/Líneas de producto).
- [Despliegue IIS — permisos](despliegue-iis-permisos.md) — 401.3 por ACL NTFS rota (falta IUSR/Usuarios); fix con icacls + herencia.
- [Despliegue SmarterASP.NET](despliegue-smarterasp.md) — dominio raíz admin-v2; config `production-smarterasp` (base-href /, web.config raíz, environment propio); subir dist por FTP.
- [Módulo Relación Trapeadores](modulo-relacion-trapeadores.md) — CRUD de combinaciones materia1+materia2→producción con UM/cantidad; hermano de relacion-liquidos, selectores de producto sin wrapper por tipo (usa ProductosService.buscarPaginado directo).
- [PENDIENTE: fix SCSS inline en listados](pendiente-fix-scss-inline-relacion-liquidos.md) — 6 listados con `styles:` inline (incumple regla 01): relacion-liquidos, compras, productos, proveedores, estaciones, usuarios; clientes/tipos-cliente ya corregidos.
- [Módulo Producción Líquidos](modulo-produccion-liquidos.md) — primer reporte de solo lectura (sin CRUD); rango de fechas migrado de `input type="date"` a `mat-date-range-input` (regla 18); cascada rol(12/13)→usuario sin catálogo propio (reusa UsuariosService); loadChildren consistente con dominios vecinos.
- [Módulo Producción Trapeadores](modulo-produccion-trapeadores.md) — hermano de Producción Líquidos (mismo SP con `idTipoMovInventario=32` fijo); primer módulo que nace con `mat-date-range-input` (regla 18); menú como ítem de nivel superior (no anidado en Productos); ícono Tabler `wash`.
- [Módulo Producción a granel](modulo-produccion-agranel.md) — listado del proceso (filtros usuario rol 13/estatus/fechas) + acciones operativas de los WS móviles (agregar MPL, envasado, aprobar por fila con max = solicitada); reusa buscarProductos('envasar') de RelacionLiquidosService; ícono `flask`.
- [Módulo Inventario físico](modulo-inventario-fisico.md) — nombre editable inline; diálogo XL de ajuste con **primer precedente de paginación local** (`Paginador` + `app-paginador` con links sintéticos); badges Cant. Físico por signo; `estatus:-1` de ajustes = lista vacía; ícono `clipboard-list`.
- [Regla 18 actualizada: default hoy/hoy](regla18-default-hoy.md) — todo rango de fechas arranca con inicio=fin=hoy visible (no vacío); Limpiar restaura ese default; aplicado en 5 pantallas (2026-07-05).
- [Módulo Consumo de MPL](modulo-consumo-mpl.md) — reporte de solo lectura, filtros cascada Año→Mes/Almacén→Línea; sin request-model propio (usa ListarParams); catálogos Almacén/Línea reusados directo en el componente (UsuariosService/ProductosService extendido); deuda técnica de catálogos duplicados documentada.
- [Módulo Facturas Ventas](modulo-facturas-ventas.md) — listado con acciones por estatus (Ver/Reenviar/Cancelar/Consultar estatus); catálogo de estatus fijo sin endpoint → constante en `models/`; IVA del diálogo de reenvío = total (montoTotal) − subtotal (sin tasa fija); encadenado Cancelar→Consultar estatus; runtime no verificado (API no levantada en la sesión).
- [Módulo Facturas Pedidos Especiales](modulo-facturas-pedidos-especiales.md) — pantalla hermana e independiente de Facturas Ventas (decisión usuario: clonada, no parametrizada); reutiliza `DetalleVentaFactura`/`AcuseEstatusCfdi`/`EstatusCancelacionRequest`/catálogo de estatus y extiende el mismo `facturas.service.ts` con métodos `*PE`; ícono de menú `file-star` para diferenciarla; runtime no verificado.
- [Módulo Reportes > Inventario](modulo-reportes-inventario.md) — primera sub-feature del módulo Reportes; nueva sección de menú "Reportes"; las 2 exportaciones ignoran filtros de pantalla (paridad legado); catálogos Línea/Almacén reusados de ProductosService/UsuariosService.
- [Exportación Descarga vs Diferido en el front](exportacion-descarga-vs-diferido-front.md) — primer consumidor en el front de `IExportacionService`: `responseType: 'blob'` fijo + sniff de `Content-Type` para distinguir CSV de `Notificacion<string>`; gotcha `Content-Disposition` no expuesto por CORS.
- [Módulo Reportes > Cierres de Pedidos Especiales](modulo-reportes-cierres-pe.md) — hermana de Cierres de Caja sin `idAlmacen`; paginación cliente; selector Usuario `app-select-paginado` reusado.
- [Módulo Reportes > Margen Bruto](modulo-reportes-margen-bruto.md) — feature completa (API+Front); paginación server-side (rompe patrón cliente de los hermanos); rango de fechas obligatorio (excepción regla 18); quirk de la API "sin ventas" = HTTP 400 con `estatus:-1` (no 200 vacío), normalizado y notificado desde el servicio HTTP, no desde el componente.
- [Módulo Reportes > Días Promedio Inventario](modulo-reportes-dias-promedio-inventario.md) — feature completa (API+Front); rango de fechas OPCIONAL (regla 18 estándar, a diferencia de margen_bruto); 2 quirks de negocio bajo HTTP 400 (`estatus:-400` límite 365 días, `estatus:-1` sin datos), tratados igual (warning + página vacía).
- [Módulo Reportes > Drop Size](modulo-reportes-drop-size.md) — feature completa (API+Front), 8º sub-reporte; `tipo` OBLIGATORIO (a diferencia de dias_promedio_inventario) + rango de fechas OPCIONAL (regla 18 estándar, a diferencia de margen_bruto); único quirk `estatus:-1` "sin ventas" bajo HTTP 400; bug de cálculo del legado preservado en tipo Producto (no corregido).
- [Módulo Reportes > Nivel de Servicio Proveedor](modulo-reportes-nivel-servicio-proveedor.md) — feature completa (API+Front), 9º sub-reporte; rango de fechas OPCIONAL **sin default** (excepción a regla 18 en sentido inverso a margen_bruto, que sí exige default); paginación server-side pese a volumen bajo (decisión de consistencia, no de necesidad); backend corrigió un bug de división entera en `porcAtendido` que también afectaba al catálogo de Proveedores.
- [Módulo Reportes > Devoluciones a Proveedor (FE-1..FE-4 completas)](modulo-reportes-devoluciones-proveedor.md) — 10º sub-reporte, servicio HTTP real (`ReportesDevolucionesProveedorService`, sin quirk 400) + paginación server-side + export CSV dual (descarga/diferido); rango de fechas default hoy/hoy ESTÁNDAR (regla 18 sin excepción, a diferencia de nivel_servicio_proveedor); selector Proveedor reusa `ProveedoresService.buscarPaginado`; sin desajustes mock vs. contrato real.
- [Módulo Pedidos Especiales > Cierre de Caja](modulo-cierre-caja-pe.md) — apertura/ingreso, retiro, cierre; signal `cajaAbierta` compartido en el servicio (para futura `cuentas_por_cobrar_pe`); verificado 🟡: separar la pantalla combinada del legado en 2 páginas perdió una validación cliente de tope (deuda pendiente en `RetiroEfectivoComponent`) y un guard de caja abierta.
