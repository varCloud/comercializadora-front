// Único spec que ejerce la UI de login (sdd/ventas-cypress-e2e, Fase 7): el resto de los specs
// autentican programáticamente vía `cy.login()` (POST /auth/login + cy.session) para no acoplar
// cada prueba a la pantalla de login — ver design, decisión #Programmatic Auth/Session Seeding.

describe('Login — smoke UI', () => {
  it('inicia sesión con la UI real y navega más allá del guard de autenticación', () => {
    cy.visit('/authentication');

    cy.get('input[formcontrolname="usuario"]').clear().type(Cypress.env('usuario'));
    cy.get('input[formcontrolname="password"]').clear().type(Cypress.env('contrasena'));
    cy.contains('button', 'Iniciar Sesion').click();

    // Tras un login exitoso, `AppSideLoginComponent.submit()` navega a `/` (redirige a `admin`),
    // dejando la pantalla de login. No se afirma una ruta final específica del feature Ventas
    // (fuera del alcance de este smoke) — solo que el guard de autenticación quedó atrás.
    cy.location('pathname', { timeout: 15000 }).should('not.include', '/authentication');
  });
});
