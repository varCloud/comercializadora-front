# Regla 07 — Menú lateral (navegación)

El sidebar se arma a partir de **dos** fuentes en
`src/app/layouts/full/vertical/sidebar/`:

- **`sidebar-evaluaciones-data.ts` → `navItemsApp`**: el menú de **nuestro producto**
  (rutas bajo `/admin`). Esto es lo que ve el cliente.
- **`sidebar-data.ts` → `navItems`**: el menú **demo de la plantilla** Modernize
  (Home, Apps, eCommerce, etc.). Solo referencia para desarrollo.

`FullComponent` (constructor) los combina según el entorno:

```ts
if (environment.PRODUCTION) {
  this.navItems = [...this.navItemsApp];              // PROD: solo nuestras rutas
} else {
  this.navItems = [...this.navItemsApp, ...navItems]; // DEV: nuestras rutas + demos
}
```

- **Producción** (`environment.PRODUCTION === true`): se muestra **solo `navItemsApp`**.
- **Desarrollo**: se muestran `navItemsApp` **+** las páginas demo de la plantilla.

## Cómo aplicar

- Al crear una página/ruta de **producto**, **agrega su entrada en `navItemsApp`**
  (`sidebar-evaluaciones-data.ts`), nunca en `sidebar-data.ts`. Solo así aparece en prod.
- **No** agregues rutas de producto a `sidebar-data.ts` (es demo, dev-only).
- Respeta el formato `NavItem` (`navCap` para encabezados de sección; `displayName`,
  `iconName` (Tabler), `route`; `children` para submenús).
- Mantén las rutas coherentes con `/admin` y el routing del feature
  (ver regla `06-arquitectura.md`).
- No es necesario tocar la lógica de `FullComponent`: ya filtra por entorno
  automáticamente.
