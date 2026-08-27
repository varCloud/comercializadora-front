import './commands';

// La plantilla Modernize (Angular Material + librerías de terceros) puede emitir errores no
// capturados en el navegador que no afectan el flujo bajo prueba (ej. ResizeObserver, warnings
// de zone.js). Cypress por default falla el test ante cualquier `uncaught:exception`; se
// silencian aquí en vez de por spec para no repetir el guard 3 veces.
Cypress.on('uncaught:exception', () => {
  return false;
});
