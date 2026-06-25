import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CoreComponentComponent } from './core-component.component';
import { AuthGuard } from '../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: CoreComponentComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./main/dashboard/dashboard.module').then(
            (m) => m.DashboardModule
          ), canActivate:[AuthGuard]
      },
      {path: 'clients', loadChildren:() => import('./client/client.module').then(m => m.ClientModule), canActivate:[AuthGuard]},
      {path: 'master', loadChildren:() => import('./master/master.module').then(m => m.MasterModule), canActivate:[AuthGuard]},
      {path: 'user', loadChildren:() => import('./user/user.module').then(m => m.UserModule), canActivate:[AuthGuard]},
      {path: 'staff', loadChildren:() => import('./staff/staff.module').then(m => m.StaffModule), canActivate:[AuthGuard]},
      {path: 'executive', loadChildren:() => import('./executive/executive.module').then(m => m.ExecutiveModule)},
      {path: 'team-lead', loadChildren:() => import('./team-lead/team-lead.module').then(m => m.TeamLeadModule)},
      { path: 'layout-horizontal', loadChildren: () => import('./modal-dashboard/modal-dashboard.module').then(m => m.ModalDashboardModule) },
      { path: 'layout-rtl', loadChildren: () => import('./modal-dashboard/modal-dashboard.module').then(m => m.ModalDashboardModule) },
      { path: 'layout-detached', loadChildren: () => import('./modal-dashboard/modal-dashboard.module').then(m => m.ModalDashboardModule) },
      { path: 'layout-two-column', loadChildren: () => import('./modal-dashboard/modal-dashboard.module').then(m => m.ModalDashboardModule) },
      { path: 'layout-boxed', loadChildren: () => import('./modal-dashboard/modal-dashboard.module').then(m => m.ModalDashboardModule) },
      { path: 'layout-dark', loadChildren: () => import('./modal-dashboard/modal-dashboard.module').then(m => m.ModalDashboardModule) },
    ],
  },
   {path: 'cosmic-loader', loadChildren:() => import('./cosmic-loader/cosmic-loader.module').then(m => m.CosmicLoaderModule)},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CoreComponentRoutingModule {}
