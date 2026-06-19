---
name: flujo-agentes
description: Los agentes deben describirse en docs/agentes/ antes de invocarlos
type: feedback
---

El usuario quiere trabajar con **pipelines de agentes** documentados. Antes de invocar
agentes para una tarea, **describe cada agente en un archivo** dentro de
`.claude/docs/agentes/<tema>/` (rol, objetivo, entradas, pasos, salida, reglas).

**Por qué:** quiere que el flujo quede versionado y reproducible, no solo ejecutado.

**Cómo aplicar:** crear la carpeta `docs/agentes/<tema>/` con un archivo por agente
(+ README con el pipeline) y luego, como Orquestador, invocarlos en el orden definido.
Primer ejemplo: `.claude/docs/agentes/migracion-angular/` (Orquestador → Revisor de
librerías → Actualizador → Verificador) para el plan [[[migracion-a-angular-20]]].
Regla 05 vigente: estos agentes NO commitean automáticamente.
