# Módulo Relación Trapeadores

**Tipo:** decision / reference

CRUD del catálogo de combinaciones de producción de trapeadores: Materia Prima/Matra
(`idProductoMateria1`) + Bastón (`idProductoMateria2`) → Trapeador a fabricar
(`idProductoProduccion`), con Unidad de Medida (`idUnidadMedidad`, Kg/Gr) y Cantidad
(`valorUnidadMedida`, convertida /1000 igual que Líquidos). Ruta `/admin/relacion-trapeadores`,
entrada de menú bajo "Productos" junto a "Relación Liquidos" (icono Tabler `bucket-droplet`,
no hay icono literal de mop/trapeador en el set).

**Hermano directo de `relacion-liquidos`** (mismo patrón: listado paginado + buscador,
modal alta/editar/ver, baja lógica). Diferencias de diseño respecto a Líquidos:

- **Sin wrapper de productos por tipo**: la API de este módulo no expone
  `/relacion-trapeadores/productos?tipo=...` porque los 3 selectores no necesitan distinguir
  subconjuntos del catálogo. `RelacionTrapeadoresService` no tiene `buscarProductos(tipo, ...)`;
  los 3 `app-select-paginado` del form-dialog inyectan `ProductosService` directo y usan
  `buscarPaginado(q, page)`.
- **Edición SÍ incluida** (a diferencia del legado, que tenía el botón "Editar" deshabilitado
  en `EvtProduccionProductos.js`) — decisión de negocio para igualar el comportamiento de
  Líquidos.
- El sufijo del convertidor es `idUnidadMedidad === 2 ? 'Gr' : 'Kg'` (vs. `'K'`/`'L'` en
  Líquidos) — catálogo de unidades de medida propio del módulo (`SP_OBTENER_UNIDADES_DE_MEDIDA_TRAPEADORES`
  reutilizado del legado, expuesto en `GET /api/relacion-trapeadores/unidades-medida`).

**Corrige un incumplimiento del precedente**: el fix de columna `stickyEnd` (regla 10) va en
`relacion-trapeadores-list.component.scss` propio (`styleUrl`), no inline como en
`RelacionLiquidosListComponent` (ver memoria `pendiente-fix-scss-inline-relacion-liquidos.md`).

Detalle completo en `.claude/docs/feature/relacion_trapeadores/` del workspace raíz
(`hu_`, `task_`, `salida_` — HU y tablero de tareas ya escritos; documentación de salida
pendiente del paso 04).
