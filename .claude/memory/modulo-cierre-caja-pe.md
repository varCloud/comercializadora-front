---
name: modulo-cierre-caja-pe
description: "Pedidos Especiales > Cierre de Caja (apertura/ingreso, retiro, cierre); verificado 🟡 — separar una pantalla legada combinada en 2 pantallas nuevas perdió una validación cliente y un guard vivo."
metadata:
  type: project
---

Feature `cierre_caja_pe`, bloque único. Componentes: `apertura-ingreso-efectivo`,
`retiro-efectivo`, `cierre-caja` (nueva) + diálogo `autorizar-cierre-pe-dialog`. Servicio
`pedidos-especiales.service.ts` extendido con 11 endpoints de caja + signal de solo lectura
`cajaAbierta` (`refrescarCajaAbierta()`/`marcarCajaAbierta()`/`marcarCajaCerrada()`), pensado
para ser reusado por la futura `cuentas_por_cobrar_pe` sin crear un servicio/guard aparte.

**Hallazgo del paso 05 (verificador, no bloqueante pero real):** el legado tiene UNA sola
pantalla/partial (`_IngresosRetirosEfectivo.cshtml`) para Ingreso/Apertura **y** Retiro. Esa
pantalla combinada valida en cliente el tope de retiro contra `efectivoDisponible` (toast antes
de submit) y dispara `ValidaCajaAbierta()` como guard antes de mostrarse. Al separar en dos
páginas independientes (decisión de diseño documentada en `task_cierre_caja_pe.md` del
workspace), **`RetiroEfectivoComponent` se quedó sin la validación cliente de tope** (sí existe
en Ventas — `RetiroExcesoDialogComponent`, precedente correcto en este mismo repo) y sin el
guard de caja abierta al entrar directo a Retiro.

**Deuda pendiente (no bloqueante):** en `RetiroEfectivoComponent`, consultar `GET
caja/info-cierre` antes de habilitar el submit y bloquear con toast si `monto >
efectivoDisponible`, replicando el patrón de `retiro-exceso-dialog.component.ts:96-108`.

**Lección para features futuras:** cuando una pantalla del legado combina 2+ flujos y se separa
en pantallas nuevas independientes, listar explícitamente qué validaciones-cliente y qué guards
vivos tenía la pantalla combinada, y decidir a propósito si cada pantalla nueva los necesita —
no asumir que separar la UI es gratis en comportamiento. Revisar primero si ya hay un precedente
migrado en otro módulo (aquí, Ventas) antes de omitir una validación "porque el servidor ya la
tiene".
