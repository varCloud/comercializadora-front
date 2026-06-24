# Regla 15 — Selector de Sucursal: Uruapan por defecto y bloqueado

> ⚠️ **REGLA DURA.** Operamos sobre **una sola sucursal: Uruapan**. En **todo** formulario
> o filtro que tenga un selector de **sucursal**, dicho selector debe quedar **preseleccionado
> en Uruapan** y **deshabilitado** (el usuario no lo cambia).

## Cómo aplicar

- Inicializa el control con el id de Uruapan desde `CONSTANTS.SUCURSAL_DEFAULT.ID`
  (`config/constants.ts`), **no** con un `1` mágico. Hoy `ID = 1` (`Sucursal Uruapan`).
- Deja el control **deshabilitado** (`disabled`) para que no se pueda cambiar, pero su valor
  **sí debe enviarse** al backend. Con Reactive Forms usa `disabled` en la definición y
  recupera el valor con `form.getRawValue()` (un control `disabled` no aparece en `form.value`).

```ts
readonly form = this.fb.group({
  // …
  idSucursal: [{ value: CONSTANTS.SUCURSAL_DEFAULT.ID, disabled: true }, Validators.min(1)],
  idAlmacen:  [{ value: 0, disabled: true }, Validators.min(1)],
});

ngOnInit(): void {
  // Carga la cascada que dependa de la sucursal con el id fijo.
  this.cargarAlmacenes(CONSTANTS.SUCURSAL_DEFAULT.ID);
}
```

- Si hay **cascada** (sucursal → almacén), dispárala una vez con el id de Uruapan al iniciar;
  no esperes un cambio del usuario sobre el selector de sucursal (no habrá).
- El `<mat-select>` puede mostrarse (para que se vea "Sucursal Uruapan") pero **siempre
  deshabilitado**. Alternativamente puede ocultarse; lo no negociable es que el valor enviado
  sea siempre Uruapan.
- En **edición**, aunque el registro trajera otra sucursal, el selector se mantiene en Uruapan
  y bloqueado (no se permite reasignar a otra sucursal desde el panel).

## Por qué

El negocio opera una sola sucursal (Uruapan). Dejar el selector abierto invita a errores de
captura. Se centraliza el id en `CONSTANTS.SUCURSAL_DEFAULT` para que, si algún día se opera
multi-sucursal, se reactive en un solo lugar (y se ajuste/retire esta regla).

Complementa: reglas 12 (formularios), 02 (constantes, sin números mágicos).
