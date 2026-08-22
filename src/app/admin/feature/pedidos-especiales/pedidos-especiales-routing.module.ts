import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio "Pedidos Especiales" (núcleo, Bloque A en adelante). "Nuevo Pedido" (FE-A3),
// "Entregar Pedido" + "Confirmar Productos" (FE-B3/FE-B4, Bloque B), "Pedidos en Ruta" +
// "Cotizaciones" (FE-C3/FE-C4, Bloque C), "Consultar Pedidos" (FE-D3, Bloque D — cierra el
// núcleo), "Apertura/Ingreso de Efectivo" + "Retiro de Efectivo" + "Cierre de Caja" (FE-6,
// feature `cierre_caja_pe`) ya existen. "Cuentas por Cobrar" (FE-2, feature
// `cuentas_por_cobrar_pe`) se maqueta con datos mock hasta que FE-4/FE-5 la conecten al backend.
// Cargada con loadComponent (regla 06).
const routes: Routes = [
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/nuevo-pedido/nuevo-pedido.component').then((m) => m.NuevoPedidoComponent),
    data: { title: 'Nuevo Pedido Especial' },
  },
  {
    path: 'entregar-pedido',
    loadComponent: () =>
      import('./pages/entregar-pedido/entregar-pedido.component').then(
        (m) => m.EntregarPedidoComponent,
      ),
    data: { title: 'Entregar Pedido Especial' },
  },
  {
    path: 'confirmar-productos/:folio',
    loadComponent: () =>
      import('./pages/confirmar-productos/confirmar-productos.component').then(
        (m) => m.ConfirmarProductosComponent,
      ),
    data: { title: 'Confirmar Productos' },
  },
  {
    path: 'pedidos-en-ruta',
    loadComponent: () =>
      import('./pages/pedidos-en-ruta/pedidos-en-ruta.component').then(
        (m) => m.PedidosEnRutaComponent,
      ),
    data: { title: 'Pedidos en Ruta' },
  },
  {
    path: 'cotizaciones',
    loadComponent: () =>
      import('./pages/cotizaciones/cotizaciones.component').then((m) => m.CotizacionesComponent),
    data: { title: 'Cotizaciones' },
  },
  {
    path: 'consultar-pedidos',
    loadComponent: () =>
      import('./pages/consultar-pedidos/consultar-pedidos.component').then(
        (m) => m.ConsultarPedidosComponent,
      ),
    data: { title: 'Consultar Pedidos' },
  },
  {
    path: 'cuentas-por-cobrar',
    loadComponent: () =>
      import('./pages/cuentas-por-cobrar/cuentas-por-cobrar.component').then(
        (m) => m.CuentasPorCobrarComponent,
      ),
    data: { title: 'Cuentas por Cobrar' },
  },
  {
    path: 'apertura-ingreso-efectivo',
    loadComponent: () =>
      import('./pages/apertura-ingreso-efectivo/apertura-ingreso-efectivo.component').then(
        (m) => m.AperturaIngresoEfectivoComponent,
      ),
    data: { title: 'Apertura de Caja / Ingreso de Efectivo' },
  },
  {
    path: 'retiro-efectivo',
    loadComponent: () =>
      import('./pages/retiro-efectivo/retiro-efectivo.component').then(
        (m) => m.RetiroEfectivoComponent,
      ),
    data: { title: 'Retiro de Efectivo' },
  },
  {
    path: 'cierre-caja',
    loadComponent: () =>
      import('./pages/cierre-caja/cierre-caja.component').then((m) => m.CierreCajaComponent),
    data: { title: 'Cierre de Caja' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PedidosEspecialesRoutingModule {}
