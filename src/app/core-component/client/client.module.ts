import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientRoutingModule } from './client-routing.module';
import { ClientListComponent } from './client-list/client-list.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { ClientAddComponent } from './client-add/client-add.component';
import { ClientEditComponent } from './client-edit/client-edit.component';

@NgModule({
  declarations: [ClientListComponent, ClientAddComponent, ClientEditComponent],
  imports: [
    CommonModule,
    ClientRoutingModule,
    sharedModule
  ]
})
export class ClientModule { }
