# Agentes — Migración a Angular 20

Pipeline de agentes para ejecutar la migración descrita en
`.claude/docs/plans/features/migracion-a-angular-20.md`.

El **Orquestador** coordina y va llamando a los demás en orden:

```
Orquestador
  ├─ 1. Revisor de librerías   → genera el listado de librerías
  ├─ 2. Actualizador           → install/update de cada librería del listado (marca estatus)
  └─ 3. Verificador            → ng build + ng serve por cada salto (17→18→19→20)
```

## Roles

| # | Agente | Archivo | Entrada | Salida |
|---|---|---|---|---|
| 0 | Orquestador | [00-orquestador.md](00-orquestador.md) | Plan de migración | Coordina y reporta |
| 1 | Revisor de librerías | [01-revisor-librerias.md](01-revisor-librerias.md) | `package.json` + plan | `librerias-migracion-angular-20.md` |
| 2 | Actualizador | [02-actualizador.md](02-actualizador.md) | Listado de librerías | Librerías actualizadas + estatus |
| 3 | Verificador | [03-verificador.md](03-verificador.md) | App actualizada | Reporte de build/serve por salto |

## Reglas comunes
- Idioma: español.
- Migración **secuencial** 17→18→19→20 (Angular no permite saltar mayores).
- Regla 05 vigente: **no commitear automáticamente**; commitear por fase solo cuando se pida.
- Resiliencia: si un paso falla con una librería, registrar el fallo y **continuar**.
- Toda decisión relevante → registrarla en `.claude/memory/`.
