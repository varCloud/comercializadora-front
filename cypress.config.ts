import { defineConfig } from 'cypress';

// Suite E2E de Cypress para el módulo Ventas (POS/Caja + Editar Ventas). Proyecto Cypress
// standalone en la raíz del repo (no `@cypress/schematic`, no builder `ng e2e` — ver
// sdd/ventas-cypress-e2e/design). Los specs viven en `cypress/e2e/**/*.cy.ts`, comandos
// personalizados en `cypress/support/`.
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    video: true,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    defaultCommandTimeout: 15000,
    retries: {
      runMode: 1,
      openMode: 0,
    },
    env: {
      // API real de comercializadora-api (.NET 10, dev HTTPS — ver environment.ts).
      apiUrl: 'https://localhost:7285/api',
      // idVenta 783389 (23 productos, Efectivo, 2026-07-23) reemplaza a la 785189 original:
      // la existencia se resuelve del idAlmacen del claim JWT del usuario logueado (admin →
      // idAlmacen 1, ver VentasController.cs:289-291), NO del idEstacion de la venta de
      // referencia ni de la que se elija en el POS. La 785189 se vendió en almacén 4 (estación
      // 1) y 9/23 de sus productos ya no tenían existencia en almacén 1 al reverificar
      // (verificado con la fórmula real de SP_V2_CONSULTA_EXISTENCIA_PRODUCTOS). 783389 se
      // verificó con las 23 líneas en stock en almacén 1 al momento de este cambio.
      idVentaReferencia: 783389,
      montoPagado: 1020,
      // `usuario`/`contrasena` NO viven aquí (archivo commiteado): vienen de
      // `cypress.env.json` (gitignorado, ver `cypress.env.example.json`). Cypress los
      // mergea automáticamente sobre este bloque `env` en runtime.
    },
    setupNodeEvents() {
      // No se requieren tareas/plugins de nodo adicionales por ahora.
    },
  },
});
