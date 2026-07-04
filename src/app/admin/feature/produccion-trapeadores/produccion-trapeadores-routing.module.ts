import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio "Producción Trapeadores". Pantalla standalone cargada con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/produccion-trapeadores-list/produccion-trapeadores-list.component').then(
        (m) => m.ProduccionTrapeadoresListComponent,
      ),
    data: { title: 'Producción Trapeadores' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProduccionTrapeadoresRoutingModule {}
