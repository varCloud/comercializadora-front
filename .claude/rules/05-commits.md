# Regla 05 — Mensajes de commit

## ⚠️ De momento: NO hacer commits inmediatos

Por indicación del equipo, **por ahora no commitees automáticamente** después de hacer
cambios. Realiza las modificaciones, déjalas en el working tree y **espera a que el
usuario pida explícitamente** commitear (y/o pushear). Tampoco hagas push automático.
Cuando se levante esta restricción, se actualizará esta regla.

## Formato (cuando el usuario pida commitear)

Formato **Conventional Commits**, en **español**.

```
tipo: descripción breve en imperativo

- detalle opcional
- detalle opcional
```

## Tipos

- `feat:` nueva funcionalidad.
- `fix:` corrección de bug.
- `docs:` documentación (CLAUDE.md, rules, README, memoria).
- `refactor:` cambio interno sin alterar comportamiento.
- `style:` formato/estilos (no afecta lógica).
- `chore:` configuración, dependencias, build.
- `test:` pruebas.

## Reglas

- Asunto en minúscula, imperativo, sin punto final, ≤ ~72 caracteres.
- Cuerpo opcional con viñetas explicando el qué/por qué.
- Commitea **solo cuando el usuario lo pida**. Si trabajas en `main`, crea una rama antes.
- No mezcles cambios no relacionados en un mismo commit (ej. la plantilla completa
  va aparte de los cambios de configuración de Claude).
