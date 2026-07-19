import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio "Inventario físico". Pantalla standalone cargada con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/inventario-fisico-list/inventario-fisico-list.component').then(
        (m) => m.InventarioFisicoListComponent,
      ),
    data: { title: 'Inventario físico' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventarioFisicoRoutingModule {}
