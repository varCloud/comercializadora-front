# Regla 21 — Paridad visual 1:1 con el legado (con componentes de Material)

> ⚠️ **REGLA DURA.** Toda pantalla migrada debe verse y organizarse **igual que la pantalla del
> sistema legado** que reemplaza. La migración cambia la **tecnología** (Angular Material en vez
> de Bootstrap + jQuery), **no el diseño**: mismas secciones, mismo orden, mismos textos, mismas
> columnas y los **mismos botones con los mismos colores y la misma posición**.

## Qué significa 1:1

- **Estructura**: mismas cards/paneles, en el mismo orden y con los mismos títulos (copiados
  literales del legado, incluidos los dos puntos: `"Agregar Productos al Pedido Especial:"`).
- **Acciones**: si el legado tiene 4 botones en el encabezado, la pantalla migrada tiene esos 4,
  con el mismo texto, el mismo color y en el mismo lugar. No se omiten "porque ya existe una
  pantalla equivalente en el menú" ni se sustituyen por navegación si en el legado son modales.
- **Modales**: lo que el legado resuelve en un modal se resuelve en un `MatDialog` **en la misma
  pantalla**. Convertir un modal en una página aparte **cambia el flujo** (se pierde el trabajo en
  curso al navegar) — ya provocó pérdidas de validaciones y guards en features anteriores.
- **Tablas**: mismas columnas, mismo orden y mismos encabezados que el legado.
- **Campos**: los que el legado no muestra en la pantalla, no se agregan; los que muestra, no se
  quitan. Si un campo del legado es código muerto, se replica igual y se documenta en el
  componente (no se "mejora" por cuenta propia).

## Cómo se implementa

- **Siempre con componentes de Angular Material** y las utilidades globales de la plantilla
  (reglas 01, 10, 12, 16, 20). Nada de portar clases de Bootstrap ni CSS del legado.
- Colores de botones con las utilidades `bg-success` / `bg-warning` / `bg-accent` / `bg-error` +
  `text-white`, o `color="primary"|"accent"|"warn"` de Material. **Nunca hex hardcodeado** (regla 01).
- Iconos Tabler equivalentes a los de FontAwesome del legado (`fa-ticket-alt` → `cash`,
  `fa-dollar-sign` → `cash-banknote`, `fa-donate` → `cash-register`, `fa-trash-alt` → `trash`).
- El look final debe ser **más limpio** (Material), pero **reconocible**: un usuario del legado
  tiene que ubicar cada control sin volver a aprender la pantalla.

## Antes de dar por terminada una pantalla

1. Abre la pantalla del legado (`http://localhost/wms-lluvia/...`) y la migrada lado a lado.
2. Compara: secciones, títulos, botones (texto/color/posición), columnas de tabla, modales.
3. Cualquier diferencia deliberada (p. ej. una acción que depende de hardware del servidor) se
   **documenta en el componente y en el `salida_<feature>.md`**, no se deja implícita.

## Por qué

La primera migración de "Nuevo Pedido Especial" quedó con otra estructura (cliente y forma de pago
en la pantalla, sin las acciones de caja, sin "Aprobar Precio Mayoreo", tabla con otras columnas):
funcionalmente parecida, pero el usuario **no reconocía su propia pantalla** y faltaban flujos
completos. La paridad visual no es cosmética: es lo que garantiza que no se pierdan acciones,
validaciones ni pasos del flujo real de trabajo.

Complementa: reglas 01 (CSS mínimo), 10 (tablas), 12 (modales/formularios), 20 (tabs).
