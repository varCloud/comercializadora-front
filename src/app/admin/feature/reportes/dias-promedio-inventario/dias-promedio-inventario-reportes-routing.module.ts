import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Reportes > Días Promedio Inventario. Pantalla standalone cargada con
// loadComponent (regla 06). Séptimo sub-reporte del módulo "Reportes" (ver admin/feature/reportes/).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dias-promedio-inventario-list/dias-promedio-inventario-list.component').then(
        (m) => m.DiasPromedioInventarioListComponent,
      ),
    data: { title: 'Reporte de Días Promedio Inventario' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DiasPromedioInventarioReportesRoutingModule {}
