import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio "Relación Liquidos". Pantalla standalone cargada con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/relacion-liquidos-list/relacion-liquidos-list.component').then(
        (m) => m.RelacionLiquidosListComponent,
      ),
    data: { title: 'Relación Liquidos' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RelacionLiquidosRoutingModule {}
