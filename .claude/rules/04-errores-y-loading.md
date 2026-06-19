# Regla 04 — Manejo de loading y notificaciones

Usa las librerías ya incluidas en el proyecto. No introduzcas otras
(sweetalert2 está en dependencias, pero para loading/avisos usa lo de abajo).

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

## Notificaciones: `NotificationService` (MatSnackBar)

> `angular-notifier` se **eliminó** en la migración a Angular 20 (no tiene release
> compatible). Se reemplazó por `NotificationService` (`src/app/services/notification.service.ts`),
> un wrapper de `MatSnackBar` que **conserva la misma firma** `notify(type, message)`.

- Inyecta `NotificationService` y notifica resultado de acciones:
  - Éxito: `this._notificationService.notify('success', 'Usuario actualizado correctamente');`
  - Error: `this._notificationService.notify('error', 'Error al actualizar usuario');`
- Estados soportados: `'success' | 'error' | 'warning' | 'info' | 'default'`. El color por
  estado lo dan las clases globales `app-snackbar-<estado>` en `assets/scss/style.scss`
  (usan las variables de marca de `_variables.scss`).
- Loguea el error técnico con `console.error(...)` además del aviso al usuario.

## Resultado de modales

- Los diálogos devuelven un `ResultModalModel` con `ENUM_ESTATUS_MODAL`
  (`src/app/models/result-modal.ts`). El componente que abre el modal reacciona en
  `afterClosed()` (ej. recargar la lista si `status == OK`).
