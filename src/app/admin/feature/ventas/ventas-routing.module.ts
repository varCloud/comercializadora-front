import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Ventas. Pantalla POS standalone cargada con loadComponent (regla 06).
// Bloque A (núcleo de venta): solo la pantalla POS por ahora. Los bloques B/C/D (caja/retiros,
// consulta/edición de ventas, ventas canceladas) agregan sus propias rutas hijas más adelante.
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/pos/pos.component').then((m) => m.PosComponent),
    data: { title: 'Ventas' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VentasRoutingModule {}
