import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio "Producción a granel". Pantalla standalone cargada con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/produccion-agranel-list/produccion-agranel-list.component').then(
        (m) => m.ProduccionAgranelListComponent,
      ),
    data: { title: 'Producción a granel' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProduccionAgranelRoutingModule {}
