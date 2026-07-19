# Módulo Inventario físico (front)

- **Tipo:** project
- **Fecha:** 2026-07-05

Pantalla `admin/inventario-fisico` (réplica de `InventarioFisico.cshtml` +
`evtInventarioFisico.js`): listado paginado (filtros Tipo Inventario General/Individual sin
TODOS + rango de fechas regla 18), alta con diálogo (solo Nombre), **nombre editable inline**
(confirmación al blur; vacío → toast y refocus), acciones Iniciar (estatus 1→2) y Ver
(estatus ≥ 2 → diálogo XL de ajuste). Feature en `admin/feature/inventario-fisico/`,
modelos en `admin/models/inventario-fisico/`, servicio `inventario-fisico.service.ts`.

Detalles no obvios:

- **Primer precedente de paginación LOCAL con `app-paginador`**: el endpoint de ajustes
  devuelve la lista completa (paridad con el modal legado). El diálogo
  `ajuste-inventario-fisico-dialog` guarda la lista en memoria y sintetiza
  `links`/`meta` del `Paginador<T>` con números de página serializados como "links"
  (`navegar` hace `parseInt`). Cumple la regla 10 (footer obligatorio) sin tocar el
  componente compartido. Reusar este patrón si otro endpoint legado no pagina.
- La API responde `estatus: -1, modelo: []` cuando no hay ajustes → el **servicio** lo
  materializa como lista vacía (no es error; el diálogo pinta "No se encontraron resultados").
- Filtros del diálogo: `ng-select` con `<ng-option [value]="0">--TODOS--</ng-option>`
  (patrón de límites de inventario); catálogos reusados de
  `UsuariosService.obtenerAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID)` y
  `ProductosService.obtenerLineas()` (regla 00).
- Badge "Cant. Físico": sin ajustar → warning `#ffae1f`; ajustado igual → `#13deb9`;
  menor → `#e53935`; mayor → `#539bff`. Sobrante/Faltante se derivan de `cantidadAAjustar`
  por el signo de (físico − actual). Ubicación: "Sin Acomodar" si idPiso/idPasillo/idRaq
  son 0, si no `(Piso) (Pasillo:X) (Rack)`.
- Observaciones del ajuste: control **deshabilitado** si estatus ≠ 2 (regla 17); se lee con
  `getRawValue()`. Botones Finalizar(3)/Cancelar(4) solo con estatus 2; al éxito el diálogo
  cierra con OK y el listado se recarga (paridad con el redirect del legado).
- El listado **no** lleva buscador de texto libre (regla 13 no aplica: filtros
  estructurados; mismo criterio que Producción a granel). Orden server-side whitelist
  `fecha|nombre|estatus` vía `mat-sort-header` con el id = param `order` del back.
- Estatus 1 se llama **"Pendiente"** en BD (no "Creado"); las descripciones vienen del SP.
- Menú: ítem de nivel superior "Inventario físico", ícono `clipboard-list`, tras Compras.

Fuera de alcance (HU): WS móviles de conteo, export Excel/PDF, bloqueo global
"InventarioFisicoActivo" (pendiente transversal de decisión).
