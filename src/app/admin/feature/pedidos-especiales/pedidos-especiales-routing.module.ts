import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio "Pedidos Especiales" (núcleo, Bloque A en adelante). Hoy solo existe
// "Nuevo Pedido" (FE-A3); los sub-items de "Entregar Pedido", "Pedidos en Ruta", "Cotizaciones"
// y "Consultar Pedidos" se agregan en los Bloques B/C/D de esta misma feature (ver
// task_pedidos_especiales.md). Cargada con loadComponent (regla 06).
const routes: Routes = [
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/nuevo-pedido/nuevo-pedido.component').then((m) => m.NuevoPedidoComponent),
    data: { title: 'Nuevo Pedido Especial' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PedidosEspecialesRoutingModule {}
