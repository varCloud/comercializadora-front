import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    // Agrega aquí los features del proyecto, p. ej.:
    // children: [
    //   {
    //     path: 'productos',
    //     loadChildren: () =>
    //       import('./feature/producto/producto.module').then((m) => m.ProductoModule),
    //   },
    // ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
