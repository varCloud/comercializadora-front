import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Catalogo, CatalogoModel } from 'src/app/admin/models/shared/catalogo';
import { FormaPago, FormaPagoModel } from 'src/app/admin/models/ventas/forma-pago';
import { ProductoVenta, ProductoVentaModel } from 'src/app/admin/models/ventas/producto-venta';

/**
 * Datos SIMULADOS para la pantalla POS (FE-A3/FE-A4), mientras la API de Ventas (Bloque A del
 * task board) todavía no existe. Reemplaza al `arrayProductos`/catálogos cargados por AJAX del
 * legado (`EvtVentas.js: InitSelect2Productos`, `ObtenerPrecios_`).
 *
 * ⚠️ TODO (FE-A5 — integración real):
 * - `obtenerCatalogoProductos()` → sustituir por un endpoint real que devuelva TODOS los
 *   productos activos con existencia + rangos de precio por volumen en una sola llamada
 *   (el `ProductosService` actual pagina y no trae `existencia`/`rangos` juntos — falta
 *   definir ese contrato en la API, ver HU "Deployment de catálogo de productos en el POS").
 * - `obtenerFormasPago()` → API-A5 (`SP_CONSULTA_FORMA_PAGO`); verificar si ya existe en
 *   `facturas_ventas` antes de crear uno nuevo (regla 00). Los ids 1/4/18 aquí son los del
 *   legado (Efectivo/Crédito/Débito); pueden no coincidir con los ids reales.
 * - `obtenerUsoCfdi()` → API-A5 (`SP_CONSULTA_USO_CFDI`), mismo comentario.
 */
@Injectable({ providedIn: 'root' })
export class PosCatalogoMockService {
  private readonly productos: ProductoVenta[] = [
    new ProductoVentaModel({
      idProducto: 1,
      descripcion: 'Refresco Cola 600ml',
      codigoBarras: '7501234560016',
      precioIndividual: 18,
      precioMenudeo: 15,
      existencia: 120,
      fraccion: false,
      rangos: [],
    }),
    new ProductoVentaModel({
      idProducto: 2,
      descripcion: 'Agua Purificada 1L',
      codigoBarras: '7501234560023',
      precioIndividual: 12,
      precioMenudeo: 10,
      existencia: 200,
      fraccion: false,
      // Rango propio de precio por volumen (prioridad sobre el 6+ genérico del ticket).
      rangos: [
        { contador: 1, idProducto: 2, min: 1, max: 5, costo: 12, porcUtilidad: 0 },
        { contador: 2, idProducto: 2, min: 6, max: 20, costo: 10, porcUtilidad: 0 },
        { contador: 3, idProducto: 2, min: 21, max: 999999, costo: 9, porcUtilidad: 0 },
      ],
    }),
    new ProductoVentaModel({
      idProducto: 3,
      descripcion: 'Detergente en Polvo 1kg',
      codigoBarras: '7501234560030',
      precioIndividual: 45,
      precioMenudeo: 40,
      existencia: 60,
      fraccion: false,
      rangos: [],
    }),
    new ProductoVentaModel({
      idProducto: 4,
      descripcion: 'Jabón de Tocador',
      codigoBarras: '7501234560047',
      precioIndividual: 9,
      precioMenudeo: 7.5,
      existencia: 300,
      fraccion: false,
      rangos: [],
    }),
    new ProductoVentaModel({
      idProducto: 5,
      descripcion: 'Aceite Comestible 1L',
      codigoBarras: '7501234560054',
      precioIndividual: 32,
      precioMenudeo: 28,
      existencia: 80,
      fraccion: false,
      rangos: [],
    }),
    new ProductoVentaModel({
      idProducto: 6,
      descripcion: 'Arroz a Granel (kg)',
      codigoBarras: '7501234560061',
      precioIndividual: 22,
      precioMenudeo: 19,
      existencia: 150,
      fraccion: true, // unidad Kilogramo → admite decimales (EvtVentas.js:2051-2059)
      rangos: [],
    }),
    new ProductoVentaModel({
      idProducto: 7,
      descripcion: 'Frijol a Granel (kg)',
      codigoBarras: '7501234560078',
      precioIndividual: 26,
      precioMenudeo: 23,
      existencia: 140,
      fraccion: true,
      rangos: [],
    }),
    new ProductoVentaModel({
      idProducto: 8,
      descripcion: 'Cloro 1L',
      codigoBarras: '7501234560085',
      precioIndividual: 15,
      precioMenudeo: 12.5,
      existencia: 5, // existencia baja, para probar el bloqueo por inventario insuficiente
      fraccion: false,
      rangos: [],
    }),
    new ProductoVentaModel({
      idProducto: 9,
      descripcion: 'Papel Higiénico 4 rollos',
      codigoBarras: '7501234560092',
      precioIndividual: 38,
      precioMenudeo: 33,
      existencia: 90,
      fraccion: false,
      rangos: [],
    }),
    new ProductoVentaModel({
      idProducto: 10,
      descripcion: 'Shampoo 750ml',
      codigoBarras: '7501234560108',
      precioIndividual: 55,
      precioMenudeo: 48,
      existencia: 40,
      fraccion: false,
      rangos: [],
    }),
    new ProductoVentaModel({
      idProducto: 11,
      descripcion: 'Café Soluble 100g',
      codigoBarras: '7501234560115',
      precioIndividual: 65,
      precioMenudeo: 58,
      existencia: 25,
      fraccion: false,
      rangos: [],
    }),
    new ProductoVentaModel({
      idProducto: 12,
      descripcion: 'Leche Entera 1L',
      codigoBarras: '7501234560122',
      precioIndividual: 21,
      precioMenudeo: 18,
      existencia: 0, // sin existencia, para probar el bloqueo "sin existencia"
      fraccion: false,
      rangos: [],
    }),
  ];

  private readonly formasPago: FormaPago[] = [
    new FormaPagoModel({ id: 1, descripcion: 'Efectivo', esEfectivo: true, esTarjeta: false }),
    new FormaPagoModel({ id: 2, descripcion: 'Transferencia', esEfectivo: false, esTarjeta: false }),
    new FormaPagoModel({ id: 4, descripcion: 'Tarjeta de Crédito', esEfectivo: false, esTarjeta: true }),
    new FormaPagoModel({ id: 18, descripcion: 'Tarjeta de Débito', esEfectivo: false, esTarjeta: true }),
  ];

  private readonly usoCfdi: Catalogo[] = [
    new CatalogoModel({ id: 1, descripcion: 'G01 - Adquisición de mercancías' }),
    new CatalogoModel({ id: 2, descripcion: 'G03 - Gastos en general' }),
    new CatalogoModel({ id: 3, descripcion: 'S01 - Sin efectos fiscales' }),
    new CatalogoModel({ id: 4, descripcion: 'P01 - Por definir' }),
  ];

  /** Carga completa del catálogo (equivalente a `arrayProductos` del legado). */
  obtenerCatalogoProductos(): Observable<ProductoVenta[]> {
    return of(this.productos).pipe(
      delay(200),
      map((productos) => productos.map((p) => new ProductoVentaModel(p))),
    );
  }

  obtenerFormasPago(): Observable<FormaPago[]> {
    return of(this.formasPago).pipe(map((lista) => lista.map((f) => new FormaPagoModel(f))));
  }

  obtenerUsoCfdi(): Observable<Catalogo[]> {
    return of(this.usoCfdi).pipe(map((lista) => lista.map((c) => new CatalogoModel(c))));
  }
}
