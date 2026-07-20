import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Reportes > Devoluciones. Pantalla standalone cargada con loadComponent
// (regla 06). Cuarta sub-feature del módulo "Reportes" (ver admin/feature/reportes/).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/devolucion-list/devolucion-list.component').then(
        (m) => m.DevolucionListComponent,
      ),
    data: { title: 'Reporte de Devoluciones' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DevolucionReportesRoutingModule {}
