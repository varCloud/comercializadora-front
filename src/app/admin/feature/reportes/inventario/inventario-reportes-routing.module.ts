import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Reportes > Inventario. Pantalla standalone cargada con loadComponent
// (regla 06). Primera sub-feature del módulo "Reportes" (ver admin/feature/reportes/).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/inventario-list/inventario-list.component').then(
        (m) => m.InventarioListComponent,
      ),
    data: { title: 'Reporte de Inventario' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventarioReportesRoutingModule {}
