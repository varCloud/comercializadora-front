---
name: subagentes-migracion
description: Subagentes invocables en .claude/agents/ para migrar pantallas legacy a admin/
type: decision
---

Se crearon **subagentes invocables** (tool `Agent`) en `.claude/agents/`:
`migrador-pantalla` → `revisor-frontend`, para portar pantallas/módulos del sistema legado
al feature de producto `src/app/admin/` (Angular 20 moderno).

**Por qué:** complementa la convención `flujo-agentes` (docs/agentes/ documenta el flujo;
`.claude/agents/` aloja los subagentes que sí se invocan). Índice en `.claude/agents/README.md`.

**Cómo aplicar:** al migrar una pantalla, invoca `migrador-pantalla` y luego
`revisor-frontend`. Ambos exigen respetar las reglas de `.claude/rules/`. Pipeline ya
cerrado de Angular 17→20 documentado en `docs/agentes/migracion-angular/`. Ver [[flujo-agentes]].
