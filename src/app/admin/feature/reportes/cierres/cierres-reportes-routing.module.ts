import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Reportes > Cierres de Caja. Pantalla standalone cargada con loadComponent
// (regla 06). Sexta sub-feature del módulo "Reportes" (ver admin/feature/reportes/).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/cierre-list/cierre-list.component').then(
        (m) => m.CierreListComponent,
      ),
    data: { title: 'Reporte de Cierres de Caja' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CierresReportesRoutingModule {}
