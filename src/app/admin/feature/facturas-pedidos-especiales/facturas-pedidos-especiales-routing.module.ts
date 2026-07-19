import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio "Facturas Pedidos Especiales". Pantalla standalone independiente de
// "Facturas Ventas" (decisión del usuario, ver HU), cargada con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/facturas-pe-list/facturas-pe-list.component').then(
        (m) => m.FacturasPeListComponent,
      ),
    data: { title: 'Facturas Pedidos Especiales' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FacturasPedidosEspecialesRoutingModule {}
