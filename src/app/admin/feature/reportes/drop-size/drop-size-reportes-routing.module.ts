import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Reportes > Drop Size. Pantalla standalone cargada con loadComponent
// (regla 06). Octavo sub-reporte del módulo "Reportes" (ver admin/feature/reportes/).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/drop-size-list/drop-size-list.component').then(
        (m) => m.DropSizeListComponent,
      ),
    data: { title: 'Reporte Drop Size' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DropSizeReportesRoutingModule {}
