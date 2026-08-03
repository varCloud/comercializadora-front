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
        path: 'clientes',
        loadChildren: () =>
          import('./feature/clientes/clientes-routing.module').then(
            (m) => m.ClientesRoutingModule,
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
        path: 'relacion-trapeadores',
        loadChildren: () =>
          import('./feature/relacion-trapeadores/relacion-trapeadores-routing.module').then(
            (m) => m.RelacionTrapeadoresRoutingModule,
          ),
      },
      {
        path: 'produccion-agranel',
        loadChildren: () =>
          import('./feature/produccion-agranel/produccion-agranel-routing.module').then(
            (m) => m.ProduccionAgranelRoutingModule,
          ),
      },
      {
        path: 'consumo-mpl',
        loadChildren: () =>
          import('./feature/consumo-mpl/consumo-mpl-routing.module').then(
            (m) => m.ConsumoMplRoutingModule,
          ),
      },
      {
        path: 'consumo-mpl-individual',
        loadChildren: () =>
          import('./feature/consumo-mpl-individual/consumo-mpl-individual-routing.module').then(
            (m) => m.ConsumoMplIndividualRoutingModule,
          ),
      },
      {
        path: 'produccion-liquidos',
        loadChildren: () =>
          import('./feature/produccion-liquidos/produccion-liquidos-routing.module').then(
            (m) => m.ProduccionLiquidosRoutingModule,
          ),
      },
      {
        path: 'produccion-trapeadores',
        loadChildren: () =>
          import('./feature/produccion-trapeadores/produccion-trapeadores-routing.module').then(
            (m) => m.ProduccionTrapeadoresRoutingModule,
          ),
      },
      {
        path: 'compras',
        loadChildren: () =>
          import('./feature/compras/compras-routing.module').then(
            (m) => m.ComprasRoutingModule,
          ),
      },
      {
        path: 'ventas',
        loadChildren: () =>
          import('./feature/ventas/ventas-routing.module').then(
            (m) => m.VentasRoutingModule,
          ),
      },
      {
        path: 'inventario-fisico',
        loadChildren: () =>
          import('./feature/inventario-fisico/inventario-fisico-routing.module').then(
            (m) => m.InventarioFisicoRoutingModule,
          ),
      },
      {
        path: 'bitacoras',
        loadChildren: () =>
          import('./feature/bitacoras/bitacoras-routing.module').then(
            (m) => m.BitacorasRoutingModule,
          ),
      },
      {
        path: 'facturas',
        loadChildren: () =>
          import('./feature/facturas/facturas-routing.module').then(
            (m) => m.FacturasRoutingModule,
          ),
      },
      {
        path: 'facturas-pedidos-especiales',
        loadChildren: () =>
          import('./feature/facturas-pedidos-especiales/facturas-pedidos-especiales-routing.module').then(
            (m) => m.FacturasPedidosEspecialesRoutingModule,
          ),
      },
      {
        path: 'pedidos-especiales',
        loadChildren: () =>
          import('./feature/pedidos-especiales/pedidos-especiales-routing.module').then(
            (m) => m.PedidosEspecialesRoutingModule,
          ),
      },
      {
        path: 'reportes/inventario',
        loadChildren: () =>
          import('./feature/reportes/inventario/inventario-reportes-routing.module').then(
            (m) => m.InventarioReportesRoutingModule,
          ),
      },
      {
        path: 'reportes/ventas',
        loadChildren: () =>
          import('./feature/reportes/ventas/ventas-reportes-routing.module').then(
            (m) => m.VentasReportesRoutingModule,
          ),
      },
      {
        path: 'reportes/ventas-pedidos-especiales',
        loadChildren: () =>
          import(
            './feature/reportes/ventas-pedidos-especiales/ventas-pe-reportes-routing.module'
          ).then((m) => m.VentasPeReportesRoutingModule),
      },
      {
        path: 'reportes/merma',
        loadChildren: () =>
          import('./feature/reportes/merma/merma-reportes-routing.module').then(
            (m) => m.MermaReportesRoutingModule,
          ),
      },
      {
        path: 'reportes/devolucion',
        loadChildren: () =>
          import('./feature/reportes/devolucion/devolucion-reportes-routing.module').then(
            (m) => m.DevolucionReportesRoutingModule,
          ),
      },
      {
        path: 'reportes/compras',
        loadChildren: () =>
          import('./feature/reportes/compras/compras-reportes-routing.module').then(
            (m) => m.ComprasReportesRoutingModule,
          ),
      },
      {
        path: 'reportes/cierres',
        loadChildren: () =>
          import('./feature/reportes/cierres/cierres-reportes-routing.module').then(
            (m) => m.CierresReportesRoutingModule,
          ),
      },
      {
        path: 'reportes/cierres-pe',
        loadChildren: () =>
          import('./feature/reportes/cierres-pe/cierres-pe-reportes-routing.module').then(
            (m) => m.CierresPEReportesRoutingModule,
          ),
      },
      {
        path: 'reportes/margen-bruto',
        loadChildren: () =>
          import('./feature/reportes/margen-bruto/margen-bruto-reportes-routing.module').then(
            (m) => m.MargenBrutoReportesRoutingModule,
          ),
      },
      {
        path: 'reportes/dias-promedio-inventario',
        loadChildren: () =>
          import(
            './feature/reportes/dias-promedio-inventario/dias-promedio-inventario-reportes-routing.module'
          ).then((m) => m.DiasPromedioInventarioReportesRoutingModule),
      },
      {
        path: 'reportes/drop-size',
        loadChildren: () =>
          import('./feature/reportes/drop-size/drop-size-reportes-routing.module').then(
            (m) => m.DropSizeReportesRoutingModule,
          ),
      },
      {
        path: 'reportes/nivel-servicio-proveedor',
        loadChildren: () =>
          import(
            './feature/reportes/nivel-servicio-proveedor/nivel-servicio-proveedor-reportes-routing.module'
          ).then((m) => m.NivelServicioProveedorReportesRoutingModule),
      },
      {
        path: 'reportes/devoluciones-proveedor',
        loadChildren: () =>
          import(
            './feature/reportes/devoluciones-proveedor/devoluciones-proveedor-reportes-routing.module'
          ).then((m) => m.DevolucionesProveedorReportesRoutingModule),
      },
      {
        path: 'reportes/devoluciones-pedidos-especiales',
        loadChildren: () =>
          import(
            './feature/reportes/devoluciones-pedidos-especiales/devoluciones-pe-reportes-routing.module'
          ).then((m) => m.DevolucionesPeReportesRoutingModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
