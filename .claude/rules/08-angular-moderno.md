# Regla 08 — Angular moderno: standalone, signals y control flow nativo

Todo **código nuevo** debe usar las APIs modernas de Angular (17/20). No escribas
patrones legados en código nuevo. Complementa la regla `06-arquitectura.md`.

## 1. Componentes standalone (siempre)

- Crea componentes, directivas y pipes como **standalone** (`standalone: true`) con sus
  propios `imports`. **No** crees NgModules nuevos.
- Cárgalos con `loadComponent` en el routing (ver `06-arquitectura.md`).
- La plantilla heredada tiene `standalone: false` (componentes de NgModule); no es el
  patrón a seguir para lo nuevo.

## 2. Signals para estado reactivo

- Usa **signals** para el estado del componente: `signal()`, `computed()`, `effect()`.
- Inputs/outputs con la API basada en signals: **`input()`**, **`input.required()`**,
  **`output()`**, **`model()`** — en vez de `@Input()` / `@Output()`.
- Prefiere **`inject()`** para la inyección de dependencias en vez del constructor.
- Para datos de servicios HTTP, expón signals (o `toSignal()` desde un Observable) en
  lugar de propiedades mutadas a mano.

## 3. Control flow nativo (no directivas estructurales)

- Usa **`@if` / `@else`**, **`@for`**, **`@switch`** en los templates.
- **Prohibido en código nuevo**: `*ngIf`, `*ngFor`, `*ngSwitch`.
- `@for` **requiere** `track` (ej. `@for (item of items(); track item.id) { … }`).
- Usa el bloque **`@empty`** de `@for` para el estado vacío.
- Para clases/estilos dinámicos prefiere bindings nativos (`[class.x]`, `[style.x]`)
  sobre `ngClass` / `ngStyle` cuando sea simple.
- Al usar control flow nativo ya **no** necesitas importar `NgIf` / `NgForOf` / `CommonModule`
  solo por eso (evita los warnings NG8113 de imports sin usar).

## Cómo aplicar

- Código **nuevo** → siempre estas APIs. No reescribas lo heredado solo por esto, salvo
  que se pida o ya lo estés tocando (ver nota de la regla `03-idioma.md`).
- Identificadores en inglés, UI en español (regla `03`).
