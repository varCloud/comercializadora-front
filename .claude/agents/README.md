# Agentes — comercializadora-front

Subagentes de Claude Code (invocables con la tool `Agent`) para la **migración de
pantallas/módulos** del sistema legado al feature de producto `src/app/admin/`
(Angular 20, standalone + signals + control flow nativo).

Cada archivo es un subagente con frontmatter (`name`, `description`, `tools`). Su cuerpo
es el system prompt. Léelos antes de invocarlos y mantenlos alineados con las reglas de
[`../rules/`](../rules/) y [`../../CLAUDE.md`](../../CLAUDE.md).

> Convención del equipo (memoria `flujo-agentes`): los **pipelines** de agentes se
> documentan además en `../docs/agentes/<tema>/`. Aquí viven los subagentes invocables;
> allí, la descripción del flujo. El pipeline ya cerrado de Angular 17→20 está en
> `../docs/agentes/migracion-angular/`.

## Pipeline de migración de una pantalla

```
migrador-pantalla   → porta 1 pantalla/feature legacy al feature admin/ (standalone)
        │
        ▼
revisor-frontend    → npm run build + checklist de adherencia a las reglas
```

## Roles

| Agente | Archivo | Entrada | Salida |
|---|---|---|---|
| Migrador de pantalla | [migrador-pantalla.md](migrador-pantalla.md) | Pantalla/feature legacy | Feature standalone en `admin/` + servicio + rutas + menú |
| Revisor de front-end | [revisor-frontend.md](revisor-frontend.md) | Feature migrado | Reporte de build + checklist |

## Reglas comunes
- Idioma: UI en español, identificadores en inglés (regla `03`).
- Código nuevo: **standalone + signals + control flow nativo** (reglas `06`/`08`).
- HTTP solo vía servicios y `environment`/`uris-config` (regla `02`).
- **No commitear automáticamente** (regla `05`).
- Todo hallazgo/decisión → `../memory/`; ajustar las reglas según hallazgos (regla dura).
