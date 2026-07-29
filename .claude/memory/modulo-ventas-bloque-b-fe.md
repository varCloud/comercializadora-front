# Feature Ventas — Bloque B Front (FE-B3/FE-B4, sin integración real)

- **Tipo:** project
- **Fecha:** 2026-07-28

Pantallas de Caja/Retiros/Ingresos de la feature `ventas` (POS), construidas en paralelo a la
API del mismo bloque (aún no lista) — **sin ninguna llamada HTTP real**, `CajaService`
(`admin/services/caja.service.ts`) simula todas las respuestas con `of(...).pipe(delay(...))`
contra el contrato documentado en `task_ventas.md` (Bloque B). Pantallas en
`admin/feature/ventas/pages/{apertura-caja,cierre-caja,retiros-ingresos}/`, modelos en
`admin/models/ventas/` (mismos archivos: `retiro.ts`, `caja-info.ts`, `valida-apertura.ts`,
`estatus-retiro.ts`, `tipo-retiro.ts`, `tipo-ingreso-efectivo.ts`, `exceso-efectivo.ts`,
`*-request.ts`), diálogo `components/autorizar-cierre-dialog/`.

Detalles no obvios para FE-B5 (integración):

- **`CajaService` ya tiene la forma pública final** (mismos nombres de método/firma que
  usará FE-B5): `validaApertura`, `abrirCaja`, `obtenerInfoCierre`, `cerrarCaja`,
  `registrarRetiro`, `registrarIngreso`, `obtenerRetiros`, `actualizarEstatusRetiro`,
  `obtenerExcesoEfectivo`. FE-B5 solo debe reemplazar el cuerpo de cada método por la llamada
  HTTP real (`HttpClient` + `environment.BASE_URL_ADMIN` + `URIS_CONFIG.CAJA`, ya agregado);
  las pantallas no deberían necesitar cambios si el contrato coincide.
- **`CierreRequest` usa `usuarioAutoriza`/`password`** (strings, no un id numérico): el modal
  de autorización captura un **username** de texto, no un id — a diferencia del boceto del
  contrato (`usuarioAutorizaId`). Verificar el nombre real del campo contra `API-B4` antes de
  integrar.
- **Cambio de flujo respecto al legado**: el legado valida usuario/contraseña en un paso
  previo (`/Ventas/ValidarContrasena`) y luego cierra. Aquí el modal `AutorizarCierreDialogComponent`
  **solo captura** credenciales; la validación ocurre server-side dentro de la MISMA petición
  `POST /api/caja/cierre` (una sola llamada HTTP, no dos). Confirmar que `API-B4` implementa
  el cierre así.
- **Listado de retiros unificado**: el legado tiene 3 partials distintos por rol
  (`_ObtenerRetiros`, `_ObtenerRetirosV2`, `_ObtenerRetirosAutorizacion`); aquí se migró a
  **una sola pantalla/tabla** (columnas + acciones aprobar/rechazar siempre presentes en el
  markup). El filtro real por rol (qué filas/columnas debe ver cada usuario) **lo debe aplicar
  el backend real**, esta pantalla no filtra nada en cliente.
- **Paginación LOCAL** del listado de retiros (mismo patrón que `inventario-fisico`:
  `Paginador<T>` + links sintetizados con números de página) porque el mock devuelve la lista
  completa. FE-B5 debe migrarla a paginación server-side cuando el endpoint real pagine
  (actualmente el buscador también filtra en memoria — regla 13 pide server-side).
- **Badge "Exceso de efectivo" (`exceso-efectivo-badge.component`) NO está integrado al
  header global** (`layouts/full/vertical/header/header.component.html`): ese archivo es
  layout compartido de toda la app, fuera del feature `ventas`, y wirearlo hoy implicaría una
  llamada HTTP global simulada — fuera de alcance de una tarea `[INDEPENDIENTE]`. El
  componente reutiliza el patrón visual del bell/`matBadge` que ya existe en ese header (no se
  creó un patrón de notificación nuevo), pero queda como componente standalone listo para que
  FE-B5 o FE-D2 (menú de Ventas) lo coloquen en el header o en el menú.
- **Retiro por exceso**: la validación de "monto disponible" es 100% cliente (UX temprana,
  `disponibleParaRetirar = efectivoDisponible − retirosHechosDia`); la validación real es
  server-side (tope de caja), tal como pide la HU.
- Rutas nuevas bajo el mismo dominio: `admin/ventas/apertura-caja`, `admin/ventas/cierre-caja`,
  `admin/ventas/retiros-ingresos` (sin entrada de menú todavía — eso es FE-D2).

Fuera de alcance de esta tarea (documentado, no implementado): guard que redirige a Apertura
si no hay caja abierta al entrar a Ventas, impresión de ticket tras cada acción (Bloque D),
filtro real por rol en el listado de retiros (backend, FE-B5).

## FE-B5 — Integración real (2026-07-29)

`CajaService` ya usa `HttpClient` real (`BASE_URL_ADMIN` + `URIS_CONFIG.CAJA`) contra
`CajaController` de `comercializadora-api`. El contrato real (leído directo del código: DTOs en
`Models/Dtos/Caja*.cs`, `CajaController.cs`, `CajaService.cs`, `CajaRepository.cs`) difiere del
boceto FE-B1–FE-B4 (mock) en varios puntos — hallazgos no obvios documentados aquí:

- **`GET /api/caja/valida-apertura` regresa `Notificacion<int>` puro**, no el objeto rico que
  asumía el mock (`idCierre`/`requiereAutorizacionCierre`). Se simplificó `ValidaApertura` a
  `{ tieneCajaAbierta, mensaje }` (`tieneCajaAbierta = estatus === 200`).
- **No existe endpoint que exponga `requiereAutorizacionCierre`** (`SP_CONSULTA_CONFIGURACION_VENTAS`
  es interno a `CajaService.CerrarAsync` en la API, no está en `CajaController`). El legado sí
  lo consulta antes (`/Ventas/ObtenerConfiguracionVentas`). Aquí `CierreCajaComponent` intenta el
  cierre SIN credenciales primero; si el backend rechaza con un mensaje que contiene
  "autorizador" (`"Se requiere usuario y contraseña de un autorizador..."`), abre
  `AutorizarCierreDialogComponent` y reintenta con credenciales — 1 petición cuando no se exige
  autorización, 2 cuando sí (nunca una llamada de validación de password aparte). Es una
  detección por mensaje (frágil si el texto del mensaje cambia en la API) — si se agrega un
  endpoint de configuración en el futuro, reemplazar esta heurística.
- **`CajaCierreRequest` usa `Contrasena` (no `Password`)** y tiene un campo `Monto` que el
  legado (`EvtVentas.js`, `HacerCierre()`) siempre manda en `0` para el cierre (solo
  `efectivoEntregadoEnCierre` importa) — replicado igual.
- **`ActualizarEstatusRetiroRequest` usa `IdStatus`/`Monto`/`IdTipoRetiro`** (no
  `idEstatus`/`montoAutorizado` opcional como traía el mock) — `IdTipoRetiro` es obligatorio
  porque el SP actualiza una tabla distinta según sea retiro por exceso o cierre de día. Al
  rechazar, `monto` se manda en `0` (réplica de `EvtRetiros.js`).
- **`InfoCierre` (`GET /api/caja/info-cierre`) no trae `retirosHechosDia`**: el campo
  `EfectivoDisponible` que sí regresa YA VIENE NETO de los retiros del día (misma fórmula que usa
  `SP_RETIRA_EFECTIVO` para validar el tope, confirmado en `CajaService.RetirarAsync`). Se quitó
  la resta duplicada en `disponibleParaRetirar` (front) — restar de nuevo hubiera bloqueado
  retiros válidos. Se usa `retirosExcesoEfectivo` (ya existía) como dato informativo de "cuánto
  se ha retirado hoy".
- **`GET /api/caja/retiros` y `/retiros/autorizacion` NO paginan ni aceptan búsqueda de texto
  libre** (regresan `Notificacion<IEnumerable<Retiro>>` sin `links`/`meta`; solo filtros
  estructurados `idTipoRetiro`/`fecha`/`idUsuario`/`idAlmacen` vía `RetirosQuery`). Esto choca
  con la regla 10/13 ("dura, sin excepción aquí") tal como estaba redactada para esta tarea —
  **se mantiene paginación + búsqueda client-side** (último recurso ya contemplado por la regla
  10 cuando el SP no soporta paginar) sobre la lista completa que trae el endpoint real. Pendiente
  para un futuro ajuste de backend: `SP_V2_CONSULTA_RETIROS` con `@search`/`@pageNumber`/`@pageSize`
  si se quiere cerrar esta brecha sin excepción.
- **Elección de endpoint + guarda de rol**: `RetirosIngresosComponent` decide entre
  `obtenerRetiros()` (filtrado por rol, backend acota a lo propio salvo Admin/Encargado) y
  `obtenerRetirosAutorizacion()` (sin filtro, ve todo) según el rol del usuario en sesión
  (`SesionService.sesion().idRol`, comparado contra `CONSTANTS.ROLES.ADMIN`/`ENCARGADO_ALMACEN`,
  nuevo en `config/constants.ts`, réplica de `CajaService.RolAdmin`/`RolEncargadoAlmacen` en la
  API). Solo Admin/Encargado ven los controles de aprobar/rechazar (`puedeAutorizar()`).
- **Guard de caja abierta**: nuevo `src/app/guards/caja-abierta.guard.ts` (clase +
  `CanActivate`, mismo patrón que `AuthGuard`), aplicado SOLO a la ruta raíz de `ventas`
  (`ventas-routing.module.ts`) — no a apertura/cierre/retiros-ingresos (evita loop). Si la
  validación falla por error de red, permite la navegación (no bloquea por un error transitorio).
- `npm run build` verde tras todos los cambios.
