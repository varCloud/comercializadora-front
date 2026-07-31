# Regla 10 — Tablas / listados

Las pantallas de **listado** se basan en la demo `pages/datatable/kichen-sink` (sí, con la
errata `kichen`). Es el patrón visual de referencia para tablas en este proyecto.

## Estructura

- **Dos `mat-card class="cardWithShadow"`**: una para la barra superior (buscador +
  botón "Agregar") y otra para la tabla. Contenido con `mat-card-content class="p-24"`.
- Tabla `mat-table [dataSource]` con `class="w-100"` dentro de `div.table-responsive`.
- Encabezados con `class="f-s-16 f-w-600"`; celdas con `class="f-s-14"`.
- Paginador `mat-paginator` con `showFirstLastButtons`.

## Acciones con iconos (no texto)

Las acciones de fila van como **iconos Tabler**, no botones de texto:

```html
<td mat-cell *matCellDef="let row" class="action-link text-right">
  <a (click)="ver(row)" class="m-r-10 cursor-pointer" matTooltip="Ver">
    <i-tabler name="eye" class="icon-18"></i-tabler>
  </a>
  <a (click)="editar(row)" class="m-r-10 cursor-pointer" matTooltip="Editar">
    <i-tabler name="edit" class="icon-18"></i-tabler>
  </a>
  <a (click)="desactivar(row)" class="m-r-10 cursor-pointer" matTooltip="Desactivar">
    <i-tabler name="trash" class="icon-18"></i-tabler>
  </a>
</td>
```

### Excepción — muchas acciones condicionales por fila → menú desplegable "Acciones"

Cuando una fila puede tener **más de ~5 acciones posibles** (aunque la mayoría sean
condicionales y no todas se muestren a la vez), una fila de iconos sueltos se satura. En ese
caso usa un botón único **"Acciones"** (`mat-flat-button color="primary"`) con
`[matMenuTriggerFor]` que abre un `<mat-menu>` — cada acción es un `mat-menu-item` con su
ícono Tabler (mismo color por acción que ya usarías en la fila) + texto de la acción, en vez de
solo el ícono con tooltip:

```html
<button mat-flat-button color="primary" [matMenuTriggerFor]="menuAcciones">
  {{ 'feature.actions.menu' | translate }}
  <i-tabler name="chevron-down" class="icon-18"></i-tabler>
</button>
<mat-menu #menuAcciones="matMenu">
  @if (puedeVer(row)) {
    <button mat-menu-item (click)="ver(row)">
      <i-tabler name="eye" class="icon-18 m-r-8" [style.color]="'#2e7d32'"></i-tabler>
      <span>{{ 'feature.actions.ver' | translate }}</span>
    </button>
  }
  <!-- ...una entrada por acción, mismas condiciones @if que ya tendrías por fila -->
</mat-menu>
```

`MatMenuModule` ya está exportado por `MaterialModule`, no hace falta importarlo aparte.
Ejemplo real: `venta-listado` (listado "Editar Ventas", hasta 10 acciones condicionales por
fila — réplica del dropdown "Acciones" del legado, que ya resolvía este mismo problema de
saturación).

- Iconos vía `<i-tabler name="…" class="icon-18">`. En componentes **standalone** importa
  `TablerIconsModule` (los iconos ya se registran globalmente con `.pick` en `app.module`).
- Importa el barrel `MaterialModule` (`src/app/material.module.ts`) en vez de cada `Mat*Module`.
- **Color por acción** (en los iconos): **ver = verde** (`#2e7d32`), **editar = azul**
  (`#1e88e5`), **eliminar/desactivar = rojo** (`#e53935`). Se aplican con `[style.color]`.
- **La columna de acciones va `stickyEnd`** (fija a la derecha al hacer scroll horizontal):
  `<ng-container matColumnDef="action" stickyEnd>`. Para que la celda fija no se transparente,
  agrega en el componente un style mínimo:
  ```css
  .mat-mdc-cell.mat-table-sticky,
  .mat-mdc-header-cell.mat-table-sticky { background-color: var(--mat-sys-surface, #fff); }
  ```

## Responsive: filas apiladas en móvil

En **vista móvil** (≤ 768px) las tablas se apilan: cada fila se vuelve una tarjeta y cada celda
muestra su etiqueta. En escritorio se ven normales (con su columna de acciones sticky).

- Agrega la clase **`table-stacked-mobile`** al `<table mat-table>` (junto a `w-100`).
- Pon **`[attr.data-label]`** con el encabezado de la columna en **cada** `<td mat-cell>`
  (la etiqueta que se muestra en móvil): `[attr.data-label]="'usuarios.columns.usuario' | translate"`.
- El estilo es **global y reutilizable** (`assets/scss/style.scss`, `.table-stacked-mobile` bajo
  `@media (max-width: 768px)`): oculta el header, apila filas/celdas y pinta la etiqueta con
  `::before { content: attr(data-label); }`. No dupliques este CSS por componente.

## Chips de catálogo en celdas (p. ej. rol/estatus)

Cuando una columna pinta un valor de catálogo (rol, estatus…), usa un **chip outline** con
**color distinto por tipo** (no repitas el mismo). Color determinístico por id:

```ts
private readonly rolePalette = ['#5d87ff','#fa896b','#13deb9','#ffae1f','#539bff','#2e7d32','#7c4dff','#e91e63','#00838f','#8d6e63'];
rolColor(id: number) { return this.rolePalette[Math.abs(id) % this.rolePalette.length]; }
```

```html
<span class="rol-chip" [style.color]="rolColor(u.idRol)" [style.borderColor]="rolColor(u.idRol)">{{ u.descripcionRol }}</span>
```

`.rol-chip` = pill outline (`border:1px solid; border-radius:16px; padding:2px 10px;`).

## Buscador y paginación

- **Todo listado lleva buscador** (ver regla 13). El input va en la card superior con
  `i-tabler name="search"` como sufijo.

### ⚠️ REGLA DURA — TODO listado se pagina (sin excepción)

**Todo listado lleva paginación (footer `app-paginador`), por pequeño que sea el conjunto de
datos.** No existe "este catálogo es chico, no hace falta paginar": siempre se pagina. Tamaños
y página inicial desde `CONSTANTS.PAGINATION` (`config/constants.ts`).

- **Server-side, navegación por links.** La API responde `Notificacion` con `links` y `meta`
  junto a `estatus`/`mensaje`, y los datos en `modelo`:
  - `links`: `first/last/prev/next` (URLs absolutas; null en los extremos).
  - `meta`: `currentPage/from/lastPage/path/perPage/to/total`.
  **La navegación usa los `links`**, no se recompone el número de página.
  - El **servicio** tipa la respuesta como `Notificacion<T[]>` y la normaliza (en `mapPage`) a
    `PagedResult<T>` (`{ data, links, meta }`); expone `listar(opts)` (primera consulta; arma
    params con `buildListParams`, `admin/models/shared/listar-params.ts`) e **`irLink(url)`**
    (GET a la URL del link).
  - Estado en el componente con la clase **`Paginador<T>`** (`admin/models/shared/paginador.ts`):
    `pag.setPage(res)`, `pag.data()`, `pag.perPage()`, `pag.isEmpty()`.
  - Footer con **`<app-paginador [paginador]="pag" (navegar)="navegar($event)"
    (perPageChange)="onPerPage($event)">`** (`admin/shared/components/paginador/`). **No** se usa
    `mat-paginator` (no hay links para saltar a página arbitraria; se navega first/prev/next/last).
  - Ejemplos: Usuarios, Estaciones, Proveedores.
- **Si el SP legado no pagina, se ACTUALIZA el SP** (no se parchea en el front): se crea una
  versión `SP_V2_CONSULTA_<X>` con `@search`, `@pageNumber`, `@pageSize` (y `@order`/`@sort`
  opcionales), que devuelve dos resultsets (cabecera `status/mensaje/total` + página) con
  `OFFSET/FETCH` — ver `comercializadora-api/store-procedures/`. El SP nuevo **no reemplaza** al
  legado.
- **Paginación en cliente** (traer todo + `slice`) queda como **último recurso** solo si no es
  posible tocar el SP. Aun así, el footer `app-paginador` es obligatorio: nunca un `mat-table`
  sin paginación.

Complementa: reglas 06 (standalone), 08 (signals/control flow), 01 (CSS mínimo).
