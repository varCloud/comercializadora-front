import type { VentaApi } from '../../support/commands';

// Escenario principal (sdd/ventas-cypress-e2e): replica la venta real `Cypress.env('idVentaReferencia')`
// a través del POS real (23 líneas, checkout Efectivo con `Cypress.env('montoPagado')`) y
// verifica la venta creada contra `GET /ventas/{newId}` — sin fixture estático (drift guard, ver
// design). El idVenta/montoPagado de referencia viven en `cypress.config.ts` (no hardcodeados
// aquí) porque ya se tuvieron que rotar una vez: la existencia se resuelve del `idAlmacen` del
// usuario logueado (JWT), no del idEstacion de la venta original — ver el comentario en
// `cypress.config.ts` sobre por qué 785189 se reemplazó por 783389. Incluye también la
// cobertura dedicada de la regresión de forma de pago (Efectivo/Tarjeta, Fase 5): el bug real
// que llegó a producción comparaba forma de pago por `descripcion`, no por `nombre`.

const parseMoney = (texto: string): number => Number(texto.replace(/[^0-9.-]/g, ''));

/**
 * Agrega UNA línea cualquiera de la venta de referencia con existencia suficiente HOY, para los
 * escenarios de regresión de forma de pago (Fase 5), que no necesitan las 23 líneas reales — solo
 * un ticket no vacío. No asume que `detalles[0]` tenga stock: el orden de `GET /ventas/{id}`
 * detalles no es el de alta original, y la existencia real puede bajar entre corridas del spec
 * (ver el historial de rotación de fixture en `cypress.config.ts`).
 */
function agregarPrimeraLineaConExistencia(referencia: VentaApi): void {
  cy.catalogoProductos().then((catalogo) => {
    const disponible = referencia.detalles.find((d) => {
      const producto = catalogo.find((p) => p.idProducto === d.idProducto);
      return (producto?.existencia ?? 0) >= d.cantidad;
    });
    expect(
      disponible,
      'Ningún producto de la venta de referencia tiene existencia suficiente hoy (drift de inventario dev)',
    ).to.exist;
    cy.agregarProducto(disponible!.idProducto, disponible!.cantidad);
  });
}

describe('POS — venta en Efectivo (réplica de venta de referencia)', () => {
  beforeEach(() => {
    cy.login();
    cy.abrirCaja();
    cy.irAlPos();
  });

  it('crea la venta replicando las 23 líneas de la venta de referencia y cobra en Efectivo con el cambio correcto', () => {
    cy.ventaReferencia().then((referencia: VentaApi) => {
      expect(referencia.detalles, 'la venta de referencia debe traer sus 23 líneas').to.have.length(23);

      // Alta de las 23 líneas reales (ver sdd/ventas-cypress-e2e/explore para el fixture completo).
      referencia.detalles.forEach((detalle) => {
        cy.agregarProducto(detalle.idProducto, detalle.cantidad);
      });

      // Aserciones por línea SOLO después del loop completo: `recalcularTicket()` reprecia todas
      // las líneas conforme la cantidad TOTAL del ticket cruza el umbral de mayoreo (>=6) — una
      // aserción a mitad del loop sería inestable/incorrecta (ver design, riesgo #4).
      referencia.detalles.forEach((detalle) => {
        cy.get(`[data-cy="pos-linea-cantidad-${detalle.idProducto}"]`).should(
          'have.value',
          String(detalle.cantidad),
        );
      });

      const cantidadTotalEsperada = referencia.detalles.reduce((acc, d) => acc + d.cantidad, 0);
      cy.get('[data-cy="pos-articulos"]').should('contain.text', String(cantidadTotalEsperada));

      cy.get('[data-cy="pos-subtotal"]')
        .invoke('text')
        .then((texto) => {
          const subtotal = parseMoney(texto);
          expect(
            subtotal,
            `Drift de catálogo: el subtotal del ticket ($${subtotal}) no coincide con el montoTotal ` +
              `de la venta de referencia ($${referencia.montoTotal}). Verifica si cambiaron precios/rangos ` +
              `de volumen de alguno de los 23 productos desde que se creó idVenta=${referencia.idVenta}.`,
          ).to.eq(referencia.montoTotal);
        });

      cy.intercept('POST', '**/api/ventas').as('guardarVenta');

      const montoPagado = Cypress.env('montoPagado') as number;
      const cambioEsperado = (montoPagado - referencia.montoTotal).toFixed(2);

      cy.cobrarEfectivo(montoPagado);

      cy.get('[data-cy="cobro-total"]')
        .invoke('text')
        .then((texto) => {
          const total = parseMoney(texto);
          expect(total, 'Drift de catálogo: el total del cobro no coincide con la referencia').to.eq(
            referencia.montoTotal,
          );
        });
      cy.get('[data-cy="cobro-cambio"]').should('contain.text', cambioEsperado);

      cy.wait('@guardarVenta').then((interception) => {
        const nuevaVenta = interception.response?.body?.modelo as VentaApi | undefined;
        expect(nuevaVenta?.idVenta, 'POST /ventas debe devolver el idVenta creado').to.be.a('number');

        const idVenta = nuevaVenta!.idVenta;

        // Auditoría de test-data (design decisión #3): cada venta real creada por el E2E queda
        // registrada aquí — no hay script de limpieza, es deuda técnica aceptada.
        cy.writeFile(
          'cypress/results/ventas-e2e.json',
          { idVenta, fecha: new Date().toISOString(), spec: 'pos-venta-efectivo.cy.ts' },
          { flag: 'a+' },
        );

        cy.apiRequest<{ estatus: number; modelo: VentaApi | null }>('GET', `/ventas/${idVenta}`).then(
          (res) => {
            const creada = res.modelo;
            expect(creada, `GET /ventas/${idVenta} debe devolver la venta recién creada`).to.exist;
            expect(creada!.montoTotal, 'montoTotal de la venta creada').to.eq(referencia.montoTotal);
            expect(creada!.idFactFormaPago, 'formaPago de la venta creada').to.eq(
              referencia.idFactFormaPago,
            );
            expect(creada!.detalles, 'la venta creada debe tener las mismas 23 líneas').to.have.length(23);

            referencia.detalles.forEach((detalleRef) => {
              const lineaCreada = creada!.detalles.find((d) => d.idProducto === detalleRef.idProducto);
              expect(
                lineaCreada,
                `la venta creada debe incluir idProducto=${detalleRef.idProducto}`,
              ).to.exist;
              expect(lineaCreada!.cantidad, `cantidad de idProducto=${detalleRef.idProducto}`).to.eq(
                detalleRef.cantidad,
              );
              expect(
                lineaCreada!.precioVenta,
                `precioVenta de idProducto=${detalleRef.idProducto} (posible drift de catálogo)`,
              ).to.eq(detalleRef.precioVenta);
              expect(
                lineaCreada!.monto,
                `monto de idProducto=${detalleRef.idProducto} (posible drift de catálogo)`,
              ).to.eq(detalleRef.monto);
            });

            cy.get('[data-cy="pos-ultimo-cambio"]').should('contain.text', cambioEsperado);
          },
        );
      });
    });
  });

  it('Efectivo: muestra "Efectivo recibido"/"Cambio" y calcula el cambio correctamente', () => {
    cy.ventaReferencia().then((referencia: VentaApi) => {
      agregarPrimeraLineaConExistencia(referencia);
    });

    cy.get('[data-cy="pos-cobrar"]').click();
    cy.get('[data-cy="cobro-forma-pago"]', { timeout: 15000 }).should('be.visible');

    // Efectivo preseleccionado por defecto (cliente genérico + Efectivo, ver cobro-dialog).
    cy.get('[data-cy="cobro-efectivo"]').should('be.visible');
    cy.get('[data-cy="cobro-cambio"]').should('be.visible');
    cy.get('[data-cy="cobro-comision"]').should('not.exist');

    cy.get('[data-cy="cobro-total"]')
      .invoke('text')
      .then((texto) => {
        const total = parseMoney(texto);
        const recibido = total + 50;
        cy.get('[data-cy="cobro-efectivo"]').clear().type(String(recibido));
        cy.get('[data-cy="cobro-cambio"]').should('contain.text', '50.00');
      });

    cy.contains('button', 'Cancelar').click();
  });

  it('Tarjeta: oculta "Efectivo recibido"/"Cambio"; muestra comisión solo si el % configurado es > 0', () => {
    cy.ventaReferencia().then((referencia: VentaApi) => {
      agregarPrimeraLineaConExistencia(referencia);
    });

    // `formasPago()` carga async (GET /ventas/catalogos/formas-pago) al abrir el diálogo — sin
    // esperarlo, el `mat-select` puede abrir su overlay CDK todavía vacío (0 `mat-option`) y el
    // siguiente `cy.get` nunca encuentra `cobro-forma-pago-*`.
    cy.intercept('GET', '**/ventas/catalogos/formas-pago').as('formasPago');
    cy.get('[data-cy="pos-cobrar"]').click();
    cy.wait('@formasPago');
    cy.get('[data-cy="cobro-forma-pago"]', { timeout: 15000 }).click();
    cy.get('[data-cy^="cobro-forma-pago-"]').contains(/tarjeta/i).click();

    cy.get('[data-cy="cobro-efectivo"]').should('not.exist');
    cy.get('[data-cy="cobro-cambio"]').should('not.exist');

    // `cobro-comision` solo renderiza si `Sesion.comisionBancaria` (config real de
    // SP_CONSULTA_CONFIGURACION_VENTAS, ver cobro-dialog.component.ts: comisionBancaria()
    // computa a 0 si el % es 0, y el @if del template lo oculta — comportamiento correcto del
    // componente, no un bug). El % es config del entorno y puede cambiar; en vez de asumir un
    // valor fijo, se lee de la misma sesión real (POST /auth/login) para que la aserción sea
    // correcta sin importar cómo esté configurado el dev DB en el momento de correr el spec.
    const apiUrl = Cypress.env('apiUrl') as string;
    cy.request('POST', `${apiUrl}/auth/login`, {
      usuario: Cypress.env('usuario'),
      contrasena: Cypress.env('contrasena'),
    }).then((res) => {
      const comisionPorcentaje = res.body?.modelo?.comisionBancaria ?? 0;
      if (comisionPorcentaje > 0) {
        cy.get('[data-cy="cobro-comision"]').should('be.visible');
      } else {
        cy.get('[data-cy="cobro-comision"]').should('not.exist');
      }
    });

    cy.contains('button', 'Cancelar').click();
  });
});
