# Regla 03 — Idioma

El proyecto es bilingüe por convención: **español para lo que ve el usuario, inglés
para el código**.

## Reglas

- **Texto de UI** (labels, botones, títulos, mensajes de notificación, opciones de
  selects): **español**. Ej. `'Usuario actualizado correctamente'`, `'Activo'`, `'Atletas'`.
- **Identificadores de código** (clases, métodos, propiedades, variables nuevas):
  **inglés** y `camelCase`/`PascalCase`. Ej. `AthleteListPageComponent`,
  `getAthletes()`, `accountStatusId`.
- **Comentarios**: español está bien (es lo que predomina).
- Mensajes de **commit**: español (ver regla 05).

## Nota

El código heredado de la plantilla y de bb-admin mezcla idiomas (ej. `displayedColumns`
con strings en español como `'fecha de creacion'`). En código **nuevo** sigue esta regla;
no reescribas lo heredado solo por idioma a menos que se pida. Ante la duda, imita el
archivo vecino.
