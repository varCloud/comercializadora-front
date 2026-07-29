import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CajaAbiertaGuard } from 'src/app/guards/caja-abierta.guard';

// Rutas del dominio Ventas. Pantallas standalone cargadas con loadComponent (regla 06).
// Bloque A (núcleo de venta): pantalla POS, protegida por CajaAbiertaGuard (FE-B5: redirige a
// apertura-caja si la estación no tiene caja abierta). Bloque B: apertura/cierre de caja y
// retiros/ingresos de efectivo — SIN el guard (evita loop de redirección hacia sí mismas).
// Bloque C: consulta/edición de ventas y ventas canceladas — comparten `VentaListadoComponent`
// (ver su doc): `data.soloCanceladas` decide el endpoint/acciones habilitadas. Bloque D (FE-D2):
// entrada de menú de producto "Ventas" en `navItemsApp` apuntando a esta ruta raíz (POS);
// `apertura-caja`/`cierre-caja`/`retiros-ingresos` no tienen entrada propia — son alcanzables
// solo desde el flujo de POS (redirección de `CajaAbiertaGuard` o botones internos del POS),
// y `listado`/`canceladas` quedan sin entrada de menú (fuera del alcance de FE-D2).
const routes: Routes = [
  {
    path: '',
    canActivate: [CajaAbiertaGuard],
    loadComponent: () =>
      import('./pages/pos/pos.component').then((m) => m.PosComponent),
    data: { title: 'Ventas' },
  },
  {
    path: 'apertura-caja',
    loadComponent: () =>
      import('./pages/apertura-caja/apertura-caja.component').then((m) => m.AperturaCajaComponent),
    data: { title: 'Apertura de caja' },
  },
  {
    path: 'cierre-caja',
    loadComponent: () =>
      import('./pages/cierre-caja/cierre-caja.component').then((m) => m.CierreCajaComponent),
    data: { title: 'Cierre de caja' },
  },
  {
    path: 'retiros-ingresos',
    loadComponent: () =>
      import('./pages/retiros-ingresos/retiros-ingresos.component').then(
        (m) => m.RetirosIngresosComponent,
      ),
    data: { title: 'Retiros e ingresos de efectivo' },
  },
  {
    path: 'listado',
    loadComponent: () =>
      import('./pages/venta-listado/venta-listado.component').then(
        (m) => m.VentaListadoComponent,
      ),
    data: { title: 'Consulta de ventas', soloCanceladas: false },
  },
  {
    path: 'canceladas',
    loadComponent: () =>
      import('./pages/venta-listado/venta-listado.component').then(
        (m) => m.VentaListadoComponent,
      ),
    data: { title: 'Ventas canceladas', soloCanceladas: true },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VentasRoutingModule {}
