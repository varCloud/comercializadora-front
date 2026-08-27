// Comandos personalizados de la suite E2E de Ventas (sdd/ventas-cypress-e2e). Autenticación y
// setup (login, apertura de caja, catálogo/venta de referencia) se hacen vía `cy.request` contra
// la API real — solo el flujo de venta en sí se maneja por UI (ver design/data-flow).

/** Envoltorio estándar `Notificacion<T>` de comercializadora-api. */
interface NotificacionApi<T> {
  estatus: number;
  mensaje: string | null;
  modelo: T | null;
  meta?: { currentPage: number; lastPage: number } | null;
}

/** Campos mínimos de `Venta` (`GET /ventas/{id}`) que consumen los specs. */
interface VentaDetalleApi {
  idProducto: number;
  descProducto: string;
  cantidad: number;
  precioVenta: number;
  monto: number;
}

export interface VentaApi {
  idVenta: number;
  idCliente: number;
  montoTotal: number;
  montoPagado?: number;
  idFactFormaPago: number;
  detalles: VentaDetalleApi[];
}

/** Campos mínimos del catálogo (`GET /productos` + `GET /ventas/existencias`) que usa `cy.agregarProducto`. */
export interface CatalogoItem {
  idProducto: number;
  descripcion: string;
  codigoBarras: string;
  /** Existencia disponible HOY en el almacén del usuario logueado (`GET /ventas/existencias`) —
   *  puede haber cambiado desde que se creó la venta de referencia (`Cypress.env('idVentaReferencia')`). */
  existencia: number;
}

/** Token capturado por `cy.login()`, en memoria del módulo (vive mientras dure el spec file). */
let authToken: string | null = null;
/** Catálogo de productos cacheado (memoizado) para no repaginar en cada `cy.agregarProducto`. */
let catalogoCache: CatalogoItem[] | null = null;

Cypress.Commands.add('login', (usuario?: string, contrasena?: string) => {
  const user = usuario ?? (Cypress.env('usuario') as string);
  const pass = contrasena ?? (Cypress.env('contrasena') as string);
  const apiUrl = Cypress.env('apiUrl') as string;

  if (!user || !pass) {
    throw new Error(
      'cy.login(): faltan credenciales. Define usuario/contrasena en cypress.env.json (ver cypress.env.example.json).',
    );
  }

  cy.session(
    user,
    () => {
      cy.request('POST', `${apiUrl}/auth/login`, { usuario: user, contrasena: pass }).then((res) => {
        const sesion = res.body?.modelo;
        if (!sesion?.token) {
          throw new Error(res.body?.mensaje ?? 'cy.login(): la API no devolvió una sesión válida');
        }
        cy.visit('/', {
          failOnStatusCode: false,
          onBeforeLoad(win) {
            win.localStorage.setItem('token', sesion.token);
            win.localStorage.setItem('sesion', JSON.stringify(sesion));
          },
        });
      });
    },
    { cacheAcrossSpecs: true },
  );

  // `cy.apiRequest` necesita el token SIEMPRE fresco (no depende de leer el localStorage del
  // AUT, que antes del primer cy.visit() de la propia prueba puede seguir en about:blank —
  // ver sdd/ventas-cypress-e2e/apply-progress). Costo: una llamada extra a /auth/login por
  // spec file; cy.session sigue evitando repetir el login por UI.
  cy.request('POST', `${apiUrl}/auth/login`, { usuario: user, contrasena: pass }).then((res) => {
    authToken = res.body?.modelo?.token ?? null;
  });
});

Cypress.Commands.add('apiRequest', <T,>(method: string, path: string, body?: unknown) => {
  const apiUrl = Cypress.env('apiUrl') as string;
  return cy
    .request<T>({
      method,
      url: `${apiUrl}${path}`,
      body,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      failOnStatusCode: false,
    })
    .then((res) => res.body as T);
});

Cypress.Commands.add('abrirCaja', (monto = 500) => {
  cy.apiRequest<NotificacionApi<number>>('GET', '/caja/valida-apertura').then((valida) => {
    if (valida?.estatus === 200) return; // la estación ya tiene caja abierta hoy

    cy.apiRequest<NotificacionApi<number>>('POST', '/caja/apertura', { monto }).then((apertura) => {
      expect(apertura?.estatus, 'cy.abrirCaja(): POST /caja/apertura falló').to.eq(200);
    });
  });
});

Cypress.Commands.add('irAlPos', () => {
  cy.intercept('GET', '**/ventas/existencias').as('existencias');
  cy.visit('/admin/ventas');
  cy.wait('@existencias', { timeout: 20000 });
});

type CatalogoBase = Omit<CatalogoItem, 'existencia'>;

const PAGE_SIZE_CATALOGO = 500;

/** Fuera de `Cypress.Commands.add` a propósito: evita que TS infiera el retorno recursivo
 *  contra la firma `Chainable<CatalogoItem[]>` declarada en el `declare global` de abajo. */
function cargarPaginaCatalogo(
  page: number,
  acumulado: CatalogoBase[],
): Cypress.Chainable<CatalogoBase[]> {
  return cy
    .apiRequest<NotificacionApi<CatalogoBase[]>>('GET', `/productos?page=${page}&perPage=${PAGE_SIZE_CATALOGO}`)
    .then((res) => {
      const pagina = (res?.modelo ?? []).map((p) => ({
        idProducto: p.idProducto,
        descripcion: p.descripcion,
        codigoBarras: p.codigoBarras,
      }));
      const nuevoAcumulado = [...acumulado, ...pagina];
      const meta = res?.meta;
      if (meta && meta.currentPage < meta.lastPage) {
        return cargarPaginaCatalogo(page + 1, nuevoAcumulado);
      }
      return cy.wrap(nuevoAcumulado, { log: false });
    });
}

Cypress.Commands.add('catalogoProductos', () => {
  if (catalogoCache) {
    return cy.wrap(catalogoCache, { log: false });
  }

  return cargarPaginaCatalogo(1, []).then((productos) =>
    cy
      .apiRequest<NotificacionApi<{ idProducto: number; cantidad: number }[]>>(
        'GET',
        '/ventas/existencias',
      )
      .then((res) => {
        const existenciaPorProducto = new Map((res?.modelo ?? []).map((e) => [e.idProducto, e.cantidad]));
        const lista: CatalogoItem[] = productos.map((p) => ({
          ...p,
          existencia: existenciaPorProducto.get(p.idProducto) ?? 0,
        }));
        catalogoCache = lista;
        return lista;
      }),
  );
});

Cypress.Commands.add('agregarProducto', (idProducto: number, cantidad: number) => {
  const filaSelector = `[data-cy="pos-linea-${idProducto}"]`;

  return cy.catalogoProductos().then((catalogo) => {
    const producto = catalogo.find((p) => p.idProducto === idProducto);
    if (!producto) {
      throw new Error(`cy.agregarProducto(): idProducto ${idProducto} no existe en el catálogo del POS`);
    }

    // Falla explícita e inmediata (no un timeout de 15-20s contra un `mat-option`/fila que NUNCA
    // va a aparecer): la existencia es del almacén EN VIVO (el del usuario logueado, vía JWT — no
    // el idEstacion de la venta de referencia) y puede haber bajado desde que se creó la venta de
    // referencia (`Cypress.env('idVentaReferencia')`) — drift real de inventario dev, no un
    // defecto del comando (ver design, riesgo residual #5, y el historial de rotación de fixture
    // en `cypress.config.ts`).
    if (producto.existencia < cantidad) {
      throw new Error(
        `cy.agregarProducto(): idProducto ${idProducto} (${producto.descripcion}) tiene existencia ` +
          `insuficiente HOY (existencia=${producto.existencia}, requerido=${cantidad}). Drift de ` +
          `inventario dev desde que se creó la venta de referencia — no es un bug del test.`,
      );
    }

    if (producto.codigoBarras) {
      cy.get('[data-cy="pos-scan-input"]').clear().type(`${producto.codigoBarras}{enter}`);
    }

    cy.get('body').then(($body) => {
      const filaYaExiste = $body.find(filaSelector).length > 0;
      if (!producto.codigoBarras || !filaYaExiste) {
        // Fallback: buscador por descripción (sin código de barras, o el código no matcheó).
        cy.get('[data-cy="pos-scan-input"]').clear().type(producto.descripcion);
        cy.get(`[data-cy="pos-sugerencia-${idProducto}"]`, { timeout: 10000 }).click();
        cy.get('[data-cy="pos-cantidad-manual"]').clear().type(String(cantidad));
        cy.get('[data-cy="pos-agregar"]').click();
      } else if (cantidad !== 1) {
        // El alta por código de barras agrega cantidad 1: ajusta a la cantidad real de la línea.
        cy.get(`[data-cy="pos-linea-cantidad-${idProducto}"]`).clear().type(String(cantidad)).blur();
      }
    });

    cy.get(filaSelector, { timeout: 20000 }).should('exist');
  });
});

Cypress.Commands.add('cobrarEfectivo', (montoRecibido: number) => {
  cy.get('[data-cy="pos-cobrar"]').click();
  cy.get('[data-cy="cobro-forma-pago"]', { timeout: 15000 }).should('be.visible');

  // Efectivo viene preseleccionado por defecto (ver design #5/cobro-dialog.component.ts); si por
  // lo que sea no lo está, se selecciona explícitamente antes de capturar el monto recibido.
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="cobro-efectivo"]').length === 0) {
      cy.get('[data-cy="cobro-forma-pago"]').click();
      cy.get('[data-cy^="cobro-forma-pago-"]').contains(/efectivo/i).click();
    }
  });

  cy.get('[data-cy="cobro-efectivo"]').clear().type(String(montoRecibido));
  cy.get('[data-cy="cobro-confirmar"]').click();
});

Cypress.Commands.add('ventaReferencia', () => {
  const idVentaReferencia = Cypress.env('idVentaReferencia') as number;
  return cy.apiRequest<NotificacionApi<VentaApi>>('GET', `/ventas/${idVentaReferencia}`).then((res) => {
    if (!res?.modelo) {
      throw new Error(
        `cy.ventaReferencia(): no se pudo obtener la venta de referencia idVenta=${idVentaReferencia}`,
      );
    }
    return res.modelo;
  });
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Login programático vía `POST /auth/login`, seedea `localStorage` (`cy.session`). */
      login(usuario?: string, contrasena?: string): Chainable<void>;
      /** Wrapper genérico de `cy.request` autenticado contra `Cypress.env('apiUrl')`. */
      apiRequest<T>(method: string, path: string, body?: unknown): Chainable<T>;
      /** Garantiza caja abierta para la estación en sesión (`GET`/`POST /caja/...`). */
      abrirCaja(monto?: number): Chainable<void>;
      /** Visita el POS y espera a que cargue el catálogo/existencias completo. */
      irAlPos(): Chainable<void>;
      /** Catálogo de productos (paginado, cacheado por spec file). */
      catalogoProductos(): Chainable<CatalogoItem[]>;
      /** Escanea por código de barras; cae al autocomplete si no hay código o no aparece la fila. */
      agregarProducto(idProducto: number, cantidad: number): Chainable<void>;
      /** Abre `CobroDialog`, confirma Efectivo con el monto recibido indicado. */
      cobrarEfectivo(montoRecibido: number): Chainable<void>;
      /** Venta de referencia (`Cypress.env('idVentaReferencia')`, ver cypress.config.ts). */
      ventaReferencia(): Chainable<VentaApi>;
    }
  }
}
