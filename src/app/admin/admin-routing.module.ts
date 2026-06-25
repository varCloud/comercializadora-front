import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./feature/dashboard/dashboard-routing.module').then(
            (m) => m.DashboardRoutingModule,
          ),
      },
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./feature/usuarios/usuarios-routing.module').then(
            (m) => m.UsuariosRoutingModule,
          ),
      },
      {
        path: 'estaciones',
        loadChildren: () =>
          import('./feature/estaciones/estaciones-routing.module').then(
            (m) => m.EstacionesRoutingModule,
          ),
      },
      {
        path: 'proveedores',
        loadChildren: () =>
          import('./feature/proveedores/proveedores-routing.module').then(
            (m) => m.ProveedoresRoutingModule,
          ),
      },
      {
        path: 'productos',
        loadChildren: () =>
          import('./feature/productos/productos-routing.module').then(
            (m) => m.ProductosRoutingModule,
          ),
      },
      {
        path: 'limites-inventario',
        loadChildren: () =>
          import('./feature/limites-inventario/limites-inventario-routing.module').then(
            (m) => m.LimitesInventarioRoutingModule,
          ),
      },
      {
        path: 'relacion-liquidos',
        loadChildren: () =>
          import('./feature/relacion-liquidos/relacion-liquidos-routing.module').then(
            (m) => m.RelacionLiquidosRoutingModule,
          ),
      },
      {
        path: 'compras',
        loadChildren: () =>
          import('./feature/compras/compras-routing.module').then(
            (m) => m.ComprasRoutingModule,
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
