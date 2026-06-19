# Regla 04 — Manejo de loading y notificaciones

Usa las librerías que **ya están en uso** en bb-admin. No introduzcas otras
(sweetalert2 está en dependencias pero bb-admin NO lo usa para esto).

## Loading / bloqueo: `ng-block-ui`

- Declara el bloque en el componente: `@BlockUI('nombre-unico') blockUILayout: NgBlockUI;`
  e importa `BlockUIModule` en el componente standalone.
- Envuelve la zona a bloquear en el template con `*blockUI="'nombre-unico'"`.
- Inicia con `blockUILayout.start()` y **siempre** detén con `finalize()` en el pipe
  del observable para que pare aun si hay error:

```ts
this._service.getData(...).pipe(
  finalize(() => this.blockUILayout.stop())
).subscribe({
  next: (res) => { /* ... */ },
  error: (err) => { /* notificar, ver abajo */ },
});
```

## Notificaciones: `angular-notifier`

- Inyecta `NotifierService` y notifica resultado de acciones:
  - Éxito: `this._notifierService.notify('success', 'Usuario actualizado correctamente');`
  - Error: `this._notifierService.notify('error', 'Error al actualizar usuario');`
- Loguea el error técnico con `console.error(...)` además del aviso al usuario.

## Resultado de modales

- Los diálogos devuelven un `ResultModalModel` con `ENUM_ESTATUS_MODAL`
  (`src/app/models/result-modal.ts`). El componente que abre el modal reacciona en
  `afterClosed()` (ej. recargar la lista si `status == OK`).
