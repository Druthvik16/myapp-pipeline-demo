import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { routes } from 'src/app/core/helpers/routes';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/core/service/auth/auth.service';
import { SidebarService } from 'src/app/core/core.index';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PasswordResetModalComponent } from '../../password-reset-modal/password-reset-modal.component';

@Component({
  selector: 'app-signin-2',
  templateUrl: './signin-2.component.html',
  styleUrl: './signin-2.component.scss',
  standalone: false,
})
export class Signin2Component {
  public routes = routes;
  loginForm!: FormGroup;
  loginform = true;
  isValidForm: boolean = 1;
  emailpattern =
    /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  users = [{ email: 'admin@example.com', password: 'admin', role: 'Admin' }];
  submitted = false;
  signinClicked = false;
  
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private messageService: MessageService,
    private authService: AuthService,
    private sideBarService: SidebarService,
    private modalService: NgbModal
  ) {
    this.loginForm = this.fb.group({
      username: [
        '',
        [Validators.required, Validators.pattern(this.emailpattern)],
      ],
      password: ['', Validators.required],
    });
  }

  public password: boolean[] = [false];

  public togglePassword(index: number) {
    this.password[index] = !this.password[index];
  }


  async onSubmit() {
    if (this.loginForm.valid) {
      this.submitted = false;
      this.signinClicked = true;
      try {
        let response = await this.authService
          .login(this.loginForm.value)
          .toPromise();
        if (response) {
          // Check if password is expired
          if (response.expired === true) {
            this.signinClicked = false;
            this.showPasswordExpiredModal();
            return;
          }
          if (response.user) {
            sessionStorage.setItem("LOGINUSER", JSON.stringify(response));
            this.sideBarService.loadSidebarBasedOnRole();
            this.messageService.add({
              summary: 'Toast',
              detail: "Welcome, " + response.user.username,
              styleClass: 'success-background-popover',
            });
            if(response.user?.user_type === 'Admin'){
              this.router.navigate([routes.index]);
            }else if(response.user?.user_type === 'Executive'){
                this.router.navigate([routes.executiveDashboad]);
            }else if(response.user?.user_type === 'Team Lead'){
              this.router.navigate([routes.preApproval]);
            }
          } else {
            this.signinClicked = false;
            this.messageService.add({
              summary: 'Toast',
              detail: 'Invalid Email Or Password',
              styleClass: 'danger-light-popover',
            });
          }
        } else {
          this.signinClicked = false;
        }
      } catch (error: any) {
        this.signinClicked = false;
        this.isValidForm = false;
        // Check if the error message indicates password expired
        const errorMessage = error?.message || error || '';
        if (typeof errorMessage === 'string' && errorMessage.includes('password has expired')) {
          this.showPasswordExpiredModal();
          return;
        }
        this.messageService.add({
          summary: 'Error',
          detail: error,
          styleClass: 'danger-light-popover',
        });
      }
    } else {
      this.isValidForm = false;
      this.signinClicked = false;
    }
  }

  showPasswordExpiredModal() {
    this.messageService.add({
      summary: 'Password Expired',
      detail: 'Your password has expired. Please reset your password to continue.',
      styleClass: 'warning-background-popover',
    });
    // Open password reset modal
    this.openPasswordResetModal();
  }

  // Method to open password reset modal
  openPasswordResetModal() {
    try {
      const modalRef = this.modalService.open(PasswordResetModalComponent, { 
        size: 'lg'
      });
      modalRef.componentInstance.username = this.loginForm.get('username')?.value;
      // Handle modal result
      modalRef.result.then((result) => {
        if (result === 'success') {
          // Password reset successful, clear form and show success message
          this.loginForm.reset();
          this.messageService.add({
            summary: 'Success',
            detail: 'Password reset successfully. Please login with your new password.',
            styleClass: 'success-background-popover',
          });
        }
      }).catch((error) => {
        // Modal dismissed, do nothing
      });
    } catch (error) {
      this.messageService.add({
        summary: 'Error',
        detail: 'Failed to open password reset modal. Please try again.',
        styleClass: 'danger-light-popover',
      });
    }
  }
}
