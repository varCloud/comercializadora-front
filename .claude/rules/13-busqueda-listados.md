# Regla 13 — Buscador en los listados

**Todos los listados deben tener buscador.** Es una regla transversal (front + back).

## Front

- Un **input de búsqueda** en la barra superior del listado (card de filtros, ver regla 10),
  con `i-tabler name="search"` como sufijo.
- La búsqueda se manda al backend (server-side), **no** se filtra solo en memoria: se pasa
  como parámetro `search` al servicio/endpoint.
- Aplica **debounce** (~300–350 ms) y `distinctUntilChanged` para no disparar una petición
  por tecla; al buscar, **resetea a la primera página** (`pageIndex = 0`).

```ts
private readonly search$ = new Subject<string>();
ngOnInit() {
  this.search$.pipe(debounceTime(350), distinctUntilChanged())
    .subscribe(v => { this.search = v; this.pageIndex.set(0); this.cargar(); });
}
applyFilter(value: string) { this.search$.next(value); }
```

## Back (API)

- El endpoint de listado expone un **query param `search`** (`[FromQuery] string? search`).
- El SP de consulta recibe `@search` y filtra por las **columnas de texto relevantes** de esa
  tabla — normalmente **nombre / descripción** (y campos clave como `usuario`), con `LIKE`:

```sql
AND (@search IS NULL OR @search = ''
     OR columna1 LIKE '%' + @search + '%'
     OR columna2 LIKE '%' + @search + '%')
```

- Ver también la convención de paginación raíz y la regla de la API
  (`comercializadora-api/.claude/arquitectura/convenciones-api.md`).

## Excepción — sub-reportes de solo consulta en `Reportes/`

Los listados del módulo **Reportes** que son de **solo consulta** (sin alta/edición) y cuyo
filtro principal ya acota el dataset de forma suficiente (p. ej. Proveedor + rango de fechas)
**no requieren buscador de texto libre adicional**, salvo que la HU lo pida explícitamente.

- Aplica hoy a: `nivel-servicio-proveedor`, `devoluciones-proveedor`, y sub-reportes futuros
  con el mismo perfil (filtro específico ya acotado, sin campo de texto libre razonable que
  buscar).
- **No** aplica a catálogos de alta/edición (Usuarios, Proveedores, Productos, etc.) ni a
  listados donde no exista un filtro equivalente que acote el dataset — ahí la regla 13 se
  cumple sin excepción.
- Si una HU de un sub-reporte futuro sí pide búsqueda de texto libre, impleméntala normal
  (regla 13 estándar); esta excepción no es un veto, es un default cuando no se pidió.

**Por qué:** dos features distintas de esta serie (`nivel_servicio_proveedor`,
`devoluciones_proveedor`) llegaron a revisión sin buscador porque la HU no lo especificó, y
revisores distintos calificaron el mismo hallazgo de forma inconsistente (uno no bloqueante,
otro bloqueante). El usuario decidió tratarlo como no bloqueante en ambos casos y documentar
la excepción aquí para que no vuelva a generar ambigüedad entre revisiones.
