import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Estaciones. Pantallas standalone cargadas con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/estaciones-list/estaciones-list.component').then(
        (m) => m.EstacionesListComponent,
      ),
    data: { title: 'Estaciones' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EstacionesRoutingModule {}
