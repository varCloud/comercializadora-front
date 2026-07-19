import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio "Consumo de MPL". Pantalla standalone cargada con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/consumo-mpl-list/consumo-mpl-list.component').then(
        (m) => m.ConsumoMplListComponent,
      ),
    data: { title: 'Consumo de MPL' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConsumoMplRoutingModule {}
