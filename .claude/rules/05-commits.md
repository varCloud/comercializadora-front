# Regla 05 — Mensajes de commit

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
