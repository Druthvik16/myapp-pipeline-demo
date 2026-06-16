import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthRoutingModule } from './auth-routing.module';
import { AuthComponent } from './auth.component'
import { sharedModule } from '../shared/shared.module';
import { Signin2Component } from './signin/signin-2/signin-2.component';
import { PasswordResetModalComponent } from './password-reset-modal/password-reset-modal.component';
import { InputOtpModule } from 'primeng/inputotp';

@NgModule({
  declarations: [
    AuthComponent,
    Signin2Component,
    PasswordResetModalComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    sharedModule,
    InputOtpModule,
  ],
})
export class AuthModule { }
