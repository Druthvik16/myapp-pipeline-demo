import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CosmicLoaderComponent } from './cosmic-loader/cosmic-loader.component';

const routes: Routes = [
  {
    path: 'cosmic', component: CosmicLoaderComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CosmicLoaderRoutingModule { }
