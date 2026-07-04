import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Clientes. Pantallas standalone cargadas con loadComponent (regla 06).
// 'tipos' = Tipos de cliente (pantalla "Descuentos" del legado, renombrada).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/clientes-list/clientes-list.component').then(
        (m) => m.ClientesListComponent,
      ),
    data: { title: 'Clientes' },
  },
  {
    path: 'tipos',
    loadComponent: () =>
      import('./pages/tipos-cliente-list/tipos-cliente-list.component').then(
        (m) => m.TiposClienteListComponent,
      ),
    data: { title: 'Tipos de cliente' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientesRoutingModule {}
