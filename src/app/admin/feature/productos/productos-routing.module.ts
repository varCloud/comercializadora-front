import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas del dominio Productos. Pantallas standalone cargadas con loadComponent (regla 06).
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/productos-list/productos-list.component').then(
        (m) => m.ProductosListComponent,
      ),
    data: { title: 'Productos' },
  },
  {
    path: 'lineas',
    loadComponent: () =>
      import('./pages/lineas-list/lineas-list.component').then(
        (m) => m.LineasListComponent,
      ),
    data: { title: 'Líneas de producto' },
  },
  {
    path: 'imprimir-ubicaciones',
    loadComponent: () =>
      import('./pages/imprimir-ubicaciones/imprimir-ubicaciones.component').then(
        (m) => m.ImprimirUbicacionesComponent,
      ),
    data: { title: 'Imprimir ubicaciones' },
  },
  {
    path: 'codigos-barras',
    loadComponent: () =>
      import('./pages/codigos-barras/codigos-barras.component').then(
        (m) => m.CodigosBarrasComponent,
      ),
    data: { title: 'Códigos de barras' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductosRoutingModule {}
