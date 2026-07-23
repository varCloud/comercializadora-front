import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Reportes > Nivel de Servicio Proveedor. Pantalla standalone cargada con
// loadComponent (regla 06). Séptima sub-feature del módulo "Reportes" (ver admin/feature/reportes/).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/nivel-servicio-proveedor-list/nivel-servicio-proveedor-list.component').then(
        (m) => m.NivelServicioProveedorListComponent,
      ),
    data: { title: 'Reporte de Nivel de Servicio Proveedor' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NivelServicioProveedorReportesRoutingModule {}
