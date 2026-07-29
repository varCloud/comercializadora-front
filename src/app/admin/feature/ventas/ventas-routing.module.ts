import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Ventas. Pantallas standalone cargadas con loadComponent (regla 06).
// Bloque A (núcleo de venta): pantalla POS. Bloque B (FE-B3/FE-B4, sin integración real
// todavía): apertura/cierre de caja y retiros/ingresos de efectivo. Los bloques C/D (consulta/
// edición de ventas, tickets PDF + menú) agregan sus propias rutas hijas más adelante.
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/pos/pos.component').then((m) => m.PosComponent),
    data: { title: 'Ventas' },
  },
  {
    path: 'apertura-caja',
    loadComponent: () =>
      import('./pages/apertura-caja/apertura-caja.component').then((m) => m.AperturaCajaComponent),
    data: { title: 'Apertura de caja' },
  },
  {
    path: 'cierre-caja',
    loadComponent: () =>
      import('./pages/cierre-caja/cierre-caja.component').then((m) => m.CierreCajaComponent),
    data: { title: 'Cierre de caja' },
  },
  {
    path: 'retiros-ingresos',
    loadComponent: () =>
      import('./pages/retiros-ingresos/retiros-ingresos.component').then(
        (m) => m.RetirosIngresosComponent,
      ),
    data: { title: 'Retiros e ingresos de efectivo' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VentasRoutingModule {}
