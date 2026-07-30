# Regla 19 — Formato de moneda: siempre `$`, nunca `USD`

> ⚠️ **REGLA DURA.** Todo monto monetario en la UI usa el pipe `currency` con **argumentos
> explícitos**. **Prohibido** `{{ monto | currency }}` a secas.

```html
<!-- ✅ Correcto -->
{{ monto | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}

<!-- ❌ Prohibido -->
{{ monto | currency }}
```

## Argumentos obligatorios

- **`'MXN'`** — código de moneda (pesos mexicanos, moneda del negocio).
- **`'symbol-narrow'`** — muestra el símbolo `$` sin el prefijo de país (evita `MX$`).
- **`'1.2-2'`** — formato de dígitos: mínimo 1 entero, 2 decimales fijos.

## Por qué

El pipe `currency` de Angular usa **`USD`** como código de moneda por defecto cuando no se
especifica ninguno, lo que puede renderizar el texto `USD` en vez del símbolo `$` que espera
el negocio (opera en pesos mexicanos). Se detectó en 13 pantallas ya migradas (`cierre-caja`,
`retiros-ingresos`, `exceso-efectivo-badge`, varios reportes) que usaban `| currency` sin
argumentos — corregidas todas a `'MXN' : 'symbol-narrow' : '1.2-2'`, el patrón que ya usaban
consistentemente el POS y los diálogos de venta. Esta regla lo hace obligatorio y explícito
para que no se repita en pantallas nuevas.

## Cómo aplicar

- Al escribir o tocar cualquier interpolación con `| currency`, verifica que lleve los 3
  argumentos completos.
- Si copias un patrón de otra pantalla, confirma que no sea uno de los casos heredados sin
  argumentos (ya corregidos, pero vigila regresiones al copiar/pegar).

Complementa: regla 03 (idioma/UI en español).
