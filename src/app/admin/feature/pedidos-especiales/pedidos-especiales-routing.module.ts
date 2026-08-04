import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio "Pedidos Especiales" (núcleo, Bloque A en adelante). "Nuevo Pedido" (FE-A3)
// y "Entregar Pedido" + "Confirmar Productos" (FE-B3/FE-B4, Bloque B) ya existen; los sub-items
// de "Pedidos en Ruta" y "Cotizaciones" se agregan en el Bloque C, "Consultar Pedidos" en el
// Bloque D (ver task_pedidos_especiales.md). Cargada con loadComponent (regla 06).
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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PedidosEspecialesRoutingModule {}
