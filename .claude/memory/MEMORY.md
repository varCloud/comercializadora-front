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
