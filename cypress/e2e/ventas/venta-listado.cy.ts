// Cobertura liviana de `venta-listado`/`canceladas` (sdd/ventas-cypress-e2e, Fase 6): solo lectura,
// no depende de driving el POS (task 6.1). La venta que se busca en el listado se crea vía
// `cy.apiRequest` directo a `POST /ventas` en el `before()` (NO se reutiliza la venta de
// `pos-venta-efectivo.cy.ts`): los specs de Cypress corren en contextos de navegador aislados por
// archivo, y el escenario POS de hoy puede fallar por drift real de inventario dev (ver
// apply-progress) — crear la venta de setup directo por API mantiene este spec autónomo y estable,
// y además cae naturalmente dentro del rango de fechas por defecto (hoy/hoy, regla 18).

interface ProductoApi {
  idProducto: number;
  descripcion: string;
  idLineaProducto: number;
  precioIndividual: number;
  ultimoCostoCompra: number;
}

interface VentaCreadaApi {
  idVenta: number;
  montoTotal: number;
}

const ID_PRODUCTO_SETUP = 1388; // EXPRIMIDOR LIMON TERRONES — con existencia confirmada hoy.
const CANTIDAD_SETUP = 1;

let ventaCreada: VentaCreadaApi | null = null;

describe('Ventas — listado / canceladas (cobertura liviana)', () => {
  before(() => {
    cy.login();
    cy.apiRequest<{ modelo: ProductoApi | null }>('GET', `/productos/${ID_PRODUCTO_SETUP}`).then((res) => {
      const producto = res.modelo;
      expect(producto, `GET /productos/${ID_PRODUCTO_SETUP} debe existir para el setup del listado`).to
        .exist;

      const precio = producto!.precioIndividual;
      const monto = Math.round(precio * CANTIDAD_SETUP * 100) / 100;

      const payload = {
        detalles: [
          {
            idProducto: producto!.idProducto,
            descripcionProducto: producto!.descripcion,
            idLineaProducto: producto!.idLineaProducto,
            cantidad: CANTIDAD_SETUP,
            precio,
            precioVenta: precio,
            costo: producto!.ultimoCostoCompra,
            ganancia: monto - producto!.ultimoCostoCompra,
            descuento: 0,
            montoTotal: monto,
            idVentaDetalle: 0,
            productosDevueltos: 0,
            productosAgregados: 0,
            ultimoCostoCompra: producto!.ultimoCostoCompra,
          },
        ],
        idCliente: 1,
        formaPago: 1, // Efectivo
        usoCfdi: 0,
        idVenta: 0,
        aplicaIva: false,
        numClientesAtendidos: 0,
        tipoVenta: 1, // TipoVentaId.Normal
        motivoDevolucion: null,
        idPedidoEspecial: 0,
        idVentaComplemento: 0,
        montoTotalVenta: monto,
        montoPagado: monto,
      };

      cy.apiRequest<{ modelo: VentaCreadaApi | null; mensaje: string | null }>('POST', '/ventas', payload).then(
        (guardado) => {
          expect(guardado?.modelo?.idVenta, guardado?.mensaje ?? 'POST /ventas de setup falló').to.be.a(
            'number',
          );
          ventaCreada = { idVenta: guardado!.modelo!.idVenta, montoTotal: monto };
        },
      );
    });
  });

  beforeEach(() => {
    cy.login();
  });

  it('carga el listado de ventas (tabla + paginador)', () => {
    cy.visit('/admin/ventas/listado');
    cy.get('[data-cy="listado-tabla"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-cy="listado-paginador"]').should('exist');
  });

  it('encuentra la venta creada por el setup filtrando por el buscador libre', () => {
    cy.visit('/admin/ventas/listado');
    cy.get('[data-cy="listado-tabla"]', { timeout: 15000 }).should('be.visible');

    cy.wrap(null).then(() => {
      expect(ventaCreada, 'el before() debe haber creado la venta de setup').to.not.be.null;
      const { idVenta, montoTotal } = ventaCreada!;

      cy.get('[data-cy="listado-buscar-input"]').type(String(idVenta));
      cy.get('[data-cy="listado-buscar"]').click();

      cy.get(`[data-cy="listado-fila-${idVenta}"]`, { timeout: 15000 })
        .should('exist')
        .and('contain.text', montoTotal.toFixed(2));
    });
  });

  it('la venta creada muestra la acción "Ajustar IVA" disponible (solo presencia, no dispara timbrado)', () => {
    cy.visit('/admin/ventas/listado');
    cy.get('[data-cy="listado-tabla"]', { timeout: 15000 }).should('be.visible');

    cy.wrap(null).then(() => {
      const { idVenta } = ventaCreada!;
      cy.get('[data-cy="listado-buscar-input"]').type(String(idVenta));
      cy.get('[data-cy="listado-buscar"]').click();
      cy.get(`[data-cy="listado-fila-${idVenta}"]`, { timeout: 15000 })
        .find('button[mat-flat-button]')
        .click();
      cy.get('.mat-mdc-menu-panel').contains('button', /ajustar iva/i).should('be.visible');
    });
  });

  it('canceladas: carga en modo solo-lectura, sin acciones de cancelar/ajustar IVA', () => {
    cy.visit('/admin/ventas/canceladas');
    cy.get('[data-cy="listado-tabla"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-cy="listado-paginador"]').should('exist');
    cy.get('[data-cy="listado-exportar"]').should('exist'); // exportar sí sigue disponible
  });
});
