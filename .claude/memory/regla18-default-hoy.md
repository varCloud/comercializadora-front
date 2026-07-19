# Regla 18 actualizada: rango de fechas con default hoy/hoy

- **Tipo:** decision
- **Fecha:** 2026-07-05

El usuario pidió que en **todos** los filtros de rango de fechas (`mat-date-range-input`)
el valor por defecto de inicio y fin sea **el día de hoy**, y que ese valor quede **visible**
en el input desde la carga inicial (antes arrancaban vacíos, con `hoy` solo como `[max]`).

## Cambio aplicado
Se actualizaron las 5 pantallas que usan `mat-date-range-input`:
`inventario-fisico`, `produccion-agranel`, `produccion-liquidos`, `produccion-trapeadores`,
`compras`. En cada una:

1. `readonly hoy = new Date();` se declaró **antes** del `FormGroup` (antes iba después;
   si el grupo lo referencia en su propia inicialización necesita ir primero, si no
   `this.hoy` es `undefined` en ese punto).
2. `FormControl<Date | null>(null)` → `FormControl<Date | null>(this.hoy)` para `inicio`
   y `fin`.
3. `limpiarFiltros()`: `rangoFechasForm.reset()` → `rangoFechasForm.reset({ inicio: this.hoy,
   fin: this.hoy })`, para que "Limpiar" **restaure el default** (hoy/hoy) en vez de dejarlo
   vacío — mismo criterio que otros filtros del listado que vuelven a su default (ej. Tipo
   Inventario → General) en vez de "sin filtro".

Efecto colateral esperado (y buscado): el primer `cargar()` de `ngOnInit` ahora consulta
con `fechaIni=fechaFin=hoy` en vez de sin filtro de fecha — el listado abre mostrando solo
los registros de hoy, no el histórico completo.

Regla actualizada: [[regla-18-rango-fechas]] en
`comercializadora-front/.claude/rules/18-rango-fechas.md`.
