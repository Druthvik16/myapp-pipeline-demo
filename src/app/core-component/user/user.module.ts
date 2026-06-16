import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing.module';
import { UserListComponent } from './user-list/user-list.component';
import { UserAddComponent } from './user-add/user-add.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { UserEditComponent } from './user-edit/user-edit.component';

@NgModule({
  declarations: [UserListComponent, UserAddComponent, UserEditComponent],
  imports: [
    CommonModule,
    UserRoutingModule,
    sharedModule
  ]
})
export class UserModule { }
