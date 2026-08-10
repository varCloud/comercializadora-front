# Regla 16 — Selectores: ng-select cuando hay muchas opciones

**Tres niveles según cuántas opciones pinte el selector:**

| Opciones | Control |
|---|---|
| **≤ 10** | `mat-select` (Angular Material, regla 12) |
| **11 – 25** | `ng-select` cargando todos los items (buscador/filtrado en cliente) |
| **> 25 desde el inicio** | **`app-select-paginado`** — ng-select **paginado en scroll** (server) |

`@ng-select/ng-select` ya está en dependencias y su tema Material está importado en
`src/styles.scss` (`@ng-select/ng-select/themes/material.theme.css`). No agregues otra librería.

## > 25 opciones → selector paginado (scroll infinito, server)

**Todo selector que pinte más de 25 elementos desde el inicio se pagina en el propio selector.**
No se cargan todos los registros: se trae una página, y al hacer **`scrollToEnd`** se pide la
**siguiente página** al server, **acumulando sin duplicar** con `arrayUnique([...actuales,
...nuevos], 'id')`. La búsqueda es server-side (`(search)`).

### ⚠️ REGLA DURA — aunque sea paginado, carga los primeros 25 al abrir

**Todo selector paginado debe traer la primera página (25 elementos) al iniciar**, sin esperar a
que el usuario haga scroll o teclee. El selector nunca arranca vacío. `app-select-paginado` ya lo
cumple: llama `cargar()` en `ngOnInit` y `pageSize` por defecto = **25**. Si creas otro selector
paginado, **respeta este comportamiento** (primera página en el init, `perPage`/`pageSize` = 25).

Usa el componente reutilizable **`app-select-paginado`**
(`admin/shared/components/select-paginado/`), que ya encapsula virtualScroll + `scrollToEnd` +
`(search)` + acumulación con `arrayUnique` (`admin/shared/utils/array-unique.ts`) + **carga de la
primera página (25) al iniciar**. El padre solo provee el `FormControl` y una función
`fetchPage(q, page) => Observable<items[]>`:

```ts
readonly fetchClavesSat = (q: string, page: number) => this.service.buscarClavesSat(q, page);
// en edición, siembra la selección actual para que el selector la muestre:
this.claveSatPreload.set([new ClaveSatModel({ claveProdServ: p.claveProdServ })]);
```
```html
<app-select-paginado
  [control]="$any(form.controls.claveProdServ)" [fetchPage]="fetchClavesSat"
  identifier="claveProdServ" bindLabel="claveProdServ" bindValue="claveProdServ"
  [preload]="claveSatPreload()" placeholder="productos.form.claveSatPlaceholder">
</app-select-paginado>
```

El endpoint debe **paginar** (`?q=&page=&perPage=`, `perPage` = 25 por defecto). Ejemplo real:
clave SAT (~52k) en el form de `productos`. En Compras: Proveedor (~153) y Producto (~1948).

## Apariencia: global, no por componente

El look de `ng-select` está homogeneizado con los `mat-form-field` en **`assets/scss/style.scss`**:
recuadro *outline* con el mismo borde/radio y **44px de alto**, igual que la densidad global de los
campos de Material (ver regla 01). **No** lo redefinas en el SCSS de un componente: si algo no
calza, se ajusta el bloque global.

## Cómo aplicar

- En el componente **standalone**, importa `NgSelectModule` from `'@ng-select/ng-select'`.
- **Catálogo finito (decenas)** → carga los items y deja que ng-select filtre en cliente:
  ```html
  <ng-select formControlName="idLineaProducto" [items]="lineas()"
             bindValue="id" bindLabel="descripcion" [readonly]="readonly"
             [placeholder]="'...' | translate"></ng-select>
  ```
- **Catálogo grande (>25)** → **NO** lo cargues completo ni con `[typeahead]` que reemplaza la
  lista: usa **`app-select-paginado`** (sección anterior), que pagina en scroll y acumula con
  `arrayUnique`. En **edición**, pásale `[preload]` con el item seleccionado para que lo muestre.
- `bindValue`/`bindLabel` definen el valor del form y el texto visible. En modo lectura el
  `FormControl` deshabilitado (form.disable()) ya bloquea el selector.
- Para `≤ 10` opciones, **mat-select** (regla 12), no ng-select.

## Por qué

Un `mat-select` con cientos/miles de opciones es inusable (sin buscador, pesado), y cargar de
golpe un catálogo de miles/decenas de miles revienta el render. La paginación en scroll trae solo
lo necesario y `arrayUnique` evita items repetidos entre páginas. Umbral de paginación: **>25
opciones desde el inicio**.

Ejemplos reales: feature `productos` (Línea = ng-select cliente ≤25; Clave SAT ~52k =
`app-select-paginado`); en Compras (próximo) Proveedor (~153) y Producto (~1948) → `app-select-paginado`.
Complementa reglas 12 (formularios) y 02 (servicios).
