import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Reportes > Devoluciones a Proveedor. Pantalla standalone cargada con
// loadComponent (regla 06). 10º sub-feature del módulo "Reportes" (ver admin/feature/reportes/).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/devoluciones-proveedor-list/devoluciones-proveedor-list.component').then(
        (m) => m.DevolucionesProveedorListComponent,
      ),
    data: { title: 'Reporte de Devoluciones a Proveedor' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DevolucionesProveedorReportesRoutingModule {}
