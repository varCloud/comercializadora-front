import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Proveedores. Pantallas standalone cargadas con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/proveedores-list/proveedores-list.component').then(
        (m) => m.ProveedoresListComponent,
      ),
    data: { title: 'Proveedores' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProveedoresRoutingModule {}
