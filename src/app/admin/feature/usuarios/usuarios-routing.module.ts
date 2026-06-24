import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Usuarios. Pantallas standalone cargadas con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/usuarios-list/usuarios-list.component').then(
        (m) => m.UsuariosListComponent,
      ),
    data: { title: 'Usuarios' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsuariosRoutingModule {}
