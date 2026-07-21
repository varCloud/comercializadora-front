import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Reportes > Cierres de Pedidos Especiales. Pantalla standalone cargada con
// loadComponent (regla 06). Séptima sub-feature del módulo "Reportes" (ver admin/feature/reportes/).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/cierre-pe-list/cierre-pe-list.component').then(
        (m) => m.CierrePEListComponent,
      ),
    data: { title: 'Reporte de Cierres de Pedidos Especiales' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CierresPEReportesRoutingModule {}
