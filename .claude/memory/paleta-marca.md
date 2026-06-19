---
name: paleta-marca
description: Paleta de colores y logo de marca de Comercializadora Lluvia
type: decision
---

**Color principal de marca: `#a6ce3a`** (verde lima del logo Lluvia).

Paleta definida (2026-06-19):
- **Primary:** `#a6ce3a` · oscuro/hover `#8bb22e` · claro `#f0f7dd`.
  Ojo: el verde es claro → el **texto encima debe ser oscuro** (`rgba(black,.87)`),
  no blanco (no contrasta). Por eso los `contrast` del palette primary son oscuros.
- **Accent (contraste):** `#1f88c4` (azul fresco, agua/lluvia) · oscuro `#1a73a8` ·
  claro `#e7f3fb`. Texto blanco encima.
- **Warning** `#ffae1f`, **Error** `#fa896b`, **Success** `#13deb9` (teal, distinto del
  verde marca), **Texto/ink** `#2a3547` → se conservaron de la plantilla.

**Dónde está definido (cambiar aquí si se ajusta la marca):**
- `src/assets/scss/_variables.scss` → `$primary`, `$accent`, `$light-primary`,
  `$light-accent` (alimentan utilidades `.text-primary` / `.bg-primary`).
- `src/assets/scss/themecolors/_default_theme.scss` → `$mat-primary` y `$mat-secondary`
  (tema Material aplicado por defecto = `$bluetheme`). Los `contrast:` definen el color
  de texto sobre cada color.
- `src/assets/scss/style.scss` → scrollbar alineado al verde de marca.

**Logo:** `src/assets/images/logos/logo_lluvia.png` (copiado del backend
`comercializadora-impresora/lluviaBackEnd`). Ya se usa en el sidebar
(`branding.component.ts`) y en `athlete-login`. **Pendiente:** las demás pantallas de
auth (side-login, boxed-*, etc.) y `full.component.html`/landing aún usan los SVG de la
plantilla (`light-logo.svg`, `dark-logo.svg`); reemplazar si se quiere rebranding total.
El logo tiene trazos negros → en sidebar **dark** podría verse mal; revisar si se usa.

**Cómo aplicar:** usa los roles del tema (`color="primary"`, `color="accent"`, clases
`.text-primary`/`.bg-primary`), nunca el hex crudo en componentes (ver
[[regla-reuso-y-css-minimo]] y `.claude/rules/01-css-minimo.md`).
