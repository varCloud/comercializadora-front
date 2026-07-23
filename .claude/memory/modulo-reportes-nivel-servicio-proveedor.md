# Módulo Reportes > Nivel de Servicio Proveedor

Feature completa (API+Front), 9º sub-reporte de Reportes. Rango de fechas **OPCIONAL sin
default** — excepción a la regla 18 estándar (que sí exige default `hoy/hoy`): campos vacíos
al cargar = histórico completo, "Buscar" nunca bloqueado, "Limpiar" restaura a vacío (no a
hoy/hoy). Mismo tipo de excepción documentada ya en `margen_bruto`, pero en sentido inverso
(ahí las fechas eran obligatorias).

Paginación **server-side** real (`irLink`), pese a que el volumen de proveedores es bajo
(~143) — decisión explícita del usuario por consistencia con `margen_bruto`, no por necesidad
de volumen.

Sin buscador (regla 13) — la HU no lo especificó; mismo criterio que otros sub-reportes de
Reportes que tampoco lo tienen, revisor-frontend lo marcó como hallazgo no bloqueante en vez
de defecto.

Servicio (`ReportesNivelServicioProveedorService`) sigue el patrón de `ReportesDevolucionService`
para el manejo de errores: sin quirk de negocio bajo HTTP 400 en este contrato (a diferencia de
`margen_bruto`/`dias_promedio_inventario`/`drop_size`), así que no normaliza nada especial — el
componente notifica directamente.

Contrato consumido: item `{ idProveedor, nombre, totalPedidosCompletos,
totalPedidosIncompletos, totalPedidosTotales, porcAtendido }`. El backend corrigió durante esta
misma feature un bug de división entera en `porcAtendido` (ver memoria del repo API,
`modulo-reportes-nivel-servicio-proveedor.md`) — el front no necesitó cambios por ese fix, solo
se benefició de datos correctos.
