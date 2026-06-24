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
