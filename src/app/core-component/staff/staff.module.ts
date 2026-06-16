import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StaffRoutingModule } from './staff-routing.module';
import { StaffListComponent } from './staff-list/staff-list.component';
import { StaffAddComponent } from './staff-add/staff-add.component';
import { StaffEditComponent } from './staff-edit/staff-edit.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    StaffListComponent,
    StaffAddComponent,
    StaffEditComponent
  ],
  imports: [
    CommonModule,
    StaffRoutingModule,
    sharedModule
  ]
})
export class StaffModule { }
