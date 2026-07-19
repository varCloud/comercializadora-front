import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Reportes > Ventas. Pantalla standalone cargada con loadComponent
// (regla 06). Segunda sub-feature del módulo "Reportes" (ver admin/feature/reportes/).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/ventas-list/ventas-list.component').then(
        (m) => m.VentasListComponent,
      ),
    data: { title: 'Reporte de Ventas' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VentasReportesRoutingModule {}
