import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Error404Component } from './error-pages/error-404/error-404.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
   {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/signin',
  },
   {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: '',
    loadChildren: () =>
      import('./core-component/core-component.module').then(
        (m) => m.CoreComponentModule
      )
  },

  {
    path: 'error-pages',
    loadChildren: () =>
      import('./error-pages/error-pages.module').then(
        (m) => m.ErrorPagesModule
      ),
  },
  {
    path: 'error-404',
    component: Error404Component,
  },
  {
    path: '**',
    redirectTo: '/error-404',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
