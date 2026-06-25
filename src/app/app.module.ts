import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoaderComponent } from './common-component/loader/loader.component';
import { sharedModule } from './shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './core/interceptor/jwt/jwt.interceptor';
import { ErrorInterceptor } from './core/interceptor/error/error.interceptor';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { provideLottieOptions } from 'ngx-lottie';
import player from 'lottie-web';


@NgModule({
  declarations: [AppComponent, LoaderComponent],
  imports: [
    BrowserModule, 
    AppRoutingModule, 
    sharedModule, 
    BrowserAnimationsModule,
    NgbModule
  ],
  exports: [],
  bootstrap: [AppComponent],
  providers:[MessageService,
    {
    provide: 'config',
    useValue: {
      toast: {
        life: 5000
      }
    }
  },
    provideLottieOptions({
     player: () => player
   })
  ]
})
export class AppModule {}
