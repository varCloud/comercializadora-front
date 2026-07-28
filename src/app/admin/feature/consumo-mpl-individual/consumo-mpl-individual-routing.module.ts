import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio "MPL Individual". Pantalla standalone cargada con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/consumo-mpl-individual-list/consumo-mpl-individual-list.component').then(
        (m) => m.ConsumoMplIndividualListComponent,
      ),
    data: { title: 'MPL Individual' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConsumoMplIndividualRoutingModule {}
