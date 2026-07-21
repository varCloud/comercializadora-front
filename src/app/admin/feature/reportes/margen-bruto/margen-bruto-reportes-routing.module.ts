import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Reportes > Margen Bruto. Pantalla standalone cargada con loadComponent
// (regla 06). Octava sub-feature del módulo "Reportes" (ver admin/feature/reportes/).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/margen-bruto-list/margen-bruto-list.component').then(
        (m) => m.MargenBrutoListComponent,
      ),
    data: { title: 'Reporte de Margen Bruto' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MargenBrutoReportesRoutingModule {}
