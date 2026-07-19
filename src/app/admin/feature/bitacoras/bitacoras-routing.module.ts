import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio "Bitácoras". Pantalla standalone cargada con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/bitacoras-list/bitacoras-list.component').then(
        (m) => m.BitacorasListComponent,
      ),
    data: { title: 'Bitácoras' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BitacorasRoutingModule {}
