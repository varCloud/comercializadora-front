import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Reportes > Merma. Pantalla standalone cargada con loadComponent
// (regla 06). Tercera sub-feature del módulo "Reportes" (ver admin/feature/reportes/).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/merma-list/merma-list.component').then(
        (m) => m.MermaListComponent,
      ),
    data: { title: 'Reporte de Merma' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MermaReportesRoutingModule {}
