import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Reportes > Compras. Pantalla standalone cargada con loadComponent
// (regla 06). Quinta sub-feature del módulo "Reportes" (ver admin/feature/reportes/).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/compras-reporte-list/compras-reporte-list.component').then(
        (m) => m.ComprasReporteListComponent,
      ),
    data: { title: 'Reporte de Compras' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComprasReportesRoutingModule {}
