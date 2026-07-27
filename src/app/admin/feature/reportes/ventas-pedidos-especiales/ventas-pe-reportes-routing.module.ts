import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Reportes > Ventas Pedidos Especiales. Pantalla standalone cargada con
// loadComponent (regla 06). Sub-reporte nuevo e independiente de Reportes > Ventas (SP
// distinto: SP_CONSULTA_VENTAS_PEDIDOS_ESPECIALESV2), mismo patrón de filtros/paginación.
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/ventas-pe-list/ventas-pe-list.component').then(
        (m) => m.VentasPeListComponent,
      ),
    data: { title: 'Reporte de Ventas Pedidos Especiales' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VentasPeReportesRoutingModule {}
