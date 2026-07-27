import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Reportes > Devoluciones Pedidos Especiales. Pantalla standalone cargada con
// loadComponent (regla 06). Hermano de Reportes > Devoluciones (ventas de piso), distinto
// origen de datos: SP_CONSULTA_DEVOLUCIONES_PEDIDOS_ESPECIALESV2.
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/devoluciones-pe-list/devoluciones-pe-list.component').then(
        (m) => m.DevolucionesPeListComponent,
      ),
    data: { title: 'Reporte de Devoluciones Pedidos Especiales' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DevolucionesPeReportesRoutingModule {}
