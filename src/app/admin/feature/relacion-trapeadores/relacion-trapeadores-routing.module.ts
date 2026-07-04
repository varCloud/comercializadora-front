import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio "Relación Trapeadores". Pantalla standalone cargada con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/relacion-trapeadores-list/relacion-trapeadores-list.component').then(
        (m) => m.RelacionTrapeadoresListComponent,
      ),
    data: { title: 'Relación Trapeadores' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RelacionTrapeadoresRoutingModule {}
