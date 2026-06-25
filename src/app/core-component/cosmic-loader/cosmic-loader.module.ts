import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CosmicLoaderRoutingModule } from './cosmic-loader-routing.module';
import { CosmicLoaderComponent } from './cosmic-loader/cosmic-loader.component';
import { LottieComponent } from 'ngx-lottie';

@NgModule({
  declarations: [
    CosmicLoaderComponent
  ],
  imports: [
    LottieComponent,
    CommonModule,
    CosmicLoaderRoutingModule
  ]
})
export class CosmicLoaderModule { }
