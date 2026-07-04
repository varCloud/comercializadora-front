import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio "Producción Líquidos". Pantalla standalone cargada con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/produccion-liquidos-list/produccion-liquidos-list.component').then(
        (m) => m.ProduccionLiquidosListComponent,
      ),
    data: { title: 'Producción Líquidos' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProduccionLiquidosRoutingModule {}
