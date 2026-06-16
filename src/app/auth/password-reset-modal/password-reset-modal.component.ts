import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MessageService } from 'primeng/api';
import { UserService } from 'src/app/core/service/user/user.service';
@Component({
  selector: 'app-password-reset-modal',
  templateUrl: './password-reset-modal.component.html',
  styleUrl: './password-reset-modal.component.scss',
  standalone: false,
})
export class PasswordResetModalComponent {
  @Input() username: string = '';
  resetPasswordForm!: FormGroup;
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private messageService: MessageService,
    private userService: UserService
  ) {
    this.resetPasswordForm = this.formBuilder.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), this.differentPasswordValidator.bind(this)]],
      confirmPassword: ['', [Validators.required, this.passwordMatchValidator.bind(this)]],
    });
  }

  // Custom validator to ensure new password is different from old password
  differentPasswordValidator(control: any) {
    const oldPassword = this.resetPasswordForm?.get('oldPassword')?.value;
    const newPassword = control.value;
    if (oldPassword && newPassword && oldPassword === newPassword) {
      return { samePassword: true };
    }
    return null;
  }

  // Custom validator for password confirmation
  passwordMatchValidator(control: any) {
    const newPassword = this.resetPasswordForm?.get('newPassword')?.value;
    const confirmPassword = control.value;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Toggle confirm password visibility
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Update password confirmation validation when password changes
  onPasswordChange() {
    const newPasswordControl = this.resetPasswordForm.get('newPassword');
    const confirmPasswordControl = this.resetPasswordForm.get('confirmPassword');
    if (newPasswordControl) {
      newPasswordControl.updateValueAndValidity();
    }
    if (confirmPasswordControl) {
      confirmPasswordControl.updateValueAndValidity();
    }
  }

  // Update validation when old password changes
  onOldPasswordChange() {
    const newPasswordControl = this.resetPasswordForm.get('newPassword');
    if (newPasswordControl) {
      newPasswordControl.updateValueAndValidity();
    }
  }

  async onSubmit() {
    if (this.resetPasswordForm.valid) {
      this.isLoading = true;
      try {
        const payload = {
          old_password: this.resetPasswordForm.get('oldPassword')?.value,
          new_password: this.resetPasswordForm.get('newPassword')?.value,
          username: this.username,
        };
        // Call the actual API endpoint
        const response: any = await this.userService.changePassword(payload).toPromise();
        if(response?.status === 400){
          this.messageService.add({
            summary: 'Error',
            detail: response?.message,
            styleClass: 'danger-light-popover',
          });
          return;
        }
        if (response) {
          this.messageService.add({
            summary: 'Success',
            detail: 'Password reset successfully. Please login with your new password.',
            styleClass: 'success-background-popover',
          });
          this.activeModal.close('success');
        } else {
          this.messageService.add({
            summary: 'Error',
            detail: 'Failed to reset password. Please try again.',
            styleClass: 'danger-light-popover',
          });
        }
      } catch (error: any) {
        this.messageService.add({
          summary: 'Error',
          detail: error || 'An error occurred while resetting password.',
          styleClass: 'danger-light-popover',
        });
      } finally {
        this.isLoading = false;
      }
    }
  }

  closeModal() {
    this.activeModal.close();
  }
}
