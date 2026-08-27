# Modernize-Angular-pro
Modernize Angular Admin Dashboard

# Sweetalert2
https://github.com/sweetalert2/ngx-sweetalert2

# E2E (Cypress) — módulo Ventas

Suite de Cypress que regresion-testea el módulo Ventas (POS/Caja + Editar Ventas) contra la API
real de `comercializadora-api` y la BD de desarrollo. Specs en `cypress/e2e/ventas/`.

## Setup

1. Copia `cypress.env.example.json` a `cypress.env.json` (gitignorado) y pon las credenciales
   dev reales (`usuario`/`contrasena`).
2. Levanta el stack local:
   - API: `dotnet run --launch-profile https` en `comercializadora-api` (https://localhost:7285).
   - Front: `npm start` en este repo (http://localhost:4200).

## Comandos

```bash
npm run e2e        # cypress run --e2e --browser chrome (headless, graba video)
npm run e2e:open   # cypress open --e2e (modo interactivo)
```

Los videos de las corridas headless quedan en `cypress/videos/` (gitignorado); screenshots de
fallos en `cypress/screenshots/`. Ambos son artefactos locales, no se suben al repo.

## Qué cubre

- `login.cy.ts`: único spec que ejerce la UI de login. El resto autentica programáticamente vía
  `cy.login()` (`POST /auth/login` + `cy.session`).
- `pos-venta-efectivo.cy.ts`: replica la venta real de referencia (`Cypress.env('idVentaReferencia')`, ver `cypress.config.ts`) a través del POS (23 líneas,
  cobro Efectivo) y verifica la venta creada contra `GET /ventas/{id}` (sin fixture estático);
  además cubre la regresión de forma de pago (Efectivo muestra "recibido"/"cambio", Tarjeta oculta
  esos campos y muestra comisión).
- `venta-listado.cy.ts`: cobertura liviana de `listado`/`canceladas` — carga, buscador, paginador,
  y presencia de la acción "Ajustar IVA" (nunca el resultado de un timbrado real).

Cada corrida que llega al checkout de `pos-venta-efectivo.cy.ts` crea una venta real en la BD dev
(sin limpieza — ver `.claude/docs/deuda-tecnica.md` #16 en la raíz del workspace). El módulo Ventas
opera en dev con inventario real: si algún producto de la venta de referencia se queda sin existencia, el
comando `cy.agregarProducto` falla con un mensaje explícito nombrando el producto (ver deuda #14).