import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Límites de Inventario. Pantalla standalone con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/limites-inventario-list/limites-inventario-list.component').then(
        (m) => m.LimitesInventarioListComponent,
      ),
    data: { title: 'Límites de Inventario' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LimitesInventarioRoutingModule {}
