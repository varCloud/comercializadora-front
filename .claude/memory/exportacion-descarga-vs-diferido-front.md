---
name: exportacion-descarga-vs-diferido-front
description: Precedente front para consumir el patrón Descarga/Diferido de IExportacionService (blob vs JSON con el mismo responseType)
type: decision
---

Primer consumidor **en el front** del patrón de exportación transversal de la API
(`IExportacionService`, ver `comercializadora-api/.claude/arquitectura/exportacion-reportes.md`):
un mismo endpoint (`GET .../exportar`) responde **o** el archivo CSV (descarga inmediata,
`≤ 1000` filas) **o** un `Notificacion<string>` JSON con el mensaje de envío diferido por
correo (`> 1000` filas). Implementado en `ReportesInventarioService.exportar()`
(`src/app/admin/services/reportes-inventario.service.ts`) — precedente para los próximos
reportes del módulo "Reportes".

## La solución: `responseType: 'blob'` fijo + sniff de `Content-Type`

Angular `HttpClient` exige declarar `responseType` de antemano; no se puede "probar" JSON y
caer a blob. Se pide **siempre** `responseType: 'blob', observe: 'response'` (necesario para
poder recibir el CSV) y se decide la rama mirando el header `Content-Type` de la respuesta:

- `application/json` → es el `Notificacion<string>` diferido, pero llega como `Blob` (por el
  `responseType` fijo). Se convierte a texto con `blob.text()` (Promise → `from(...)` de RxJS)
  y se parsea con `JSON.parse`. Se notifica el mensaje con `NotificationService`.
- cualquier otro tipo (`text/csv`) → es el archivo; se dispara la descarga con
  `URL.createObjectURL(blob)` + `<a download>` sintético + `URL.revokeObjectURL`.

Los **errores** (400: tipo inválido / usuario sin correo) también llegan con `responseType:
'blob'`, así que `HttpErrorResponse.error` es un `Blob`, no un objeto ya parseado — se aplica
el mismo `blob.text()` + `JSON.parse` en el `catchError` para mostrar el mensaje real de la API
en vez de un genérico.

`Content-Type` es un header CORS-seguro (está en la lista *safelisted*), así que se lee sin
necesitar `Access-Control-Expose-Headers` en la API — a diferencia de `Content-Disposition`
(ver gotcha abajo).

## Gotcha: `Content-Disposition` no es legible desde el navegador

`Program.cs` de la API configura CORS con `AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()`
pero **sin** `WithExposedHeaders(...)`. `Content-Disposition` no está en la lista de headers
CORS-safelisted por defecto, así que aunque el `File(...)` del controller lo setea
automáticamente (con el nombre real `{NombreReporte}_{yyyyMMdd_HHmmss}.csv`), JavaScript **no
puede leerlo** (`res.headers.get('Content-Disposition')` devuelve `null` en el navegador real,
confirmado — con `curl` sí se ve porque no aplica CORS).

**Mitigación aplicada:** el servicio intenta leer el header de todos modos (por si en el futuro
se agrega `WithExposedHeaders("Content-Disposition")` en `Program.cs`) y si no está, arma un
nombre por defecto client-side con el mismo patrón que usa `ExportacionService.cs`
(`{NombreReporte}_{timestampISO}.csv`). Si se quiere el nombre exacto del servidor, la fix real
es agregar `Content-Disposition` a `WithExposedHeaders` en la política CORS de la API (pendiente,
no bloqueante: el archivo se descarga igual, solo cambia el nombre del archivo local).

## No se pudo probar la rama de éxito en runtime

`Usuario.Correo` no existe como columna en la tabla `Usuarios` de la BD local (gap documentado
en `exportacion-reportes.md`/`exportacion-reportes-csv.md`): **ambas** ramas (descarga y
diferido) devuelven siempre `400 "El usuario no tiene correo registrado"` hoy, sin importar el
tamaño del dataset. Verificado con `curl` y con un script Node (`fetch` + `Blob`, mismas APIs
que usa el navegador) contra la API real: el `400` sí llega con `Content-Type:
application/json` y el body se parsea correctamente con la lógica de `procesarErrorExportacion`.
La rama de descarga inmediata / diferido exitoso queda pendiente de probar en runtime real hasta
que se resuelva el gap de correo (agregar la columna/alias en `SP_V2_CONSULTA_USUARIOS`).
