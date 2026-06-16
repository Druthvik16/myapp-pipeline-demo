import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminDashboard1RoutingModule } from './admin-dashboard-routing.module';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    AdminDashboardComponent
  ],
  imports: [
    CommonModule,
    AdminDashboard1RoutingModule,
    sharedModule
  ]
})
export class AdminDashboard1Module { }
