import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { MasterService } from 'src/app/core/service/master/master.service';

@Component({
  selector: 'app-reasons-add',
  standalone: false,
  templateUrl: './reasons-add.component.html',
  styleUrl: './reasons-add.component.scss'
})
export class ReasonsAddComponent {

  addReasonForm!: FormGroup;
  alphaWithSpace = '^[A-Z][a-zA-Z ]*$';
  isValidForm!: boolean;
  userData: any;

  constructor(
    private activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private masterService: MasterService
  ) { }

  ngOnInit(): void {
    this.userData = JSON.parse(sessionStorage.getItem('LOGINUSER') || '{}');
    this.isValidForm = true;
    this.addReasonForm = this.formBuilder.group({
      reason: [
        '',
        [Validators.required, Validators.pattern(this.alphaWithSpace)],
      ],
      created_by_id: [this.userData.user.id, [Validators.required]],
    });
  }

  showNotification(header: string, message: string, labelicon: any) {
    Swal.fire({
      title: header,
      text: message,
      icon: labelicon,
      confirmButtonColor: '#364574',
      confirmButtonText: 'OK',
    });
  }

  async saveUser() {
    if (this.addReasonForm.valid) {
      try {
        this.isValidForm = true;
        const payload = {
          remark: this.addReasonForm.get('reason')?.value,
          created_by_id: this.addReasonForm.get('created_by_id')?.value,
        };
        let response = await this.masterService.createReject(payload).toPromise();
        if (
          response.status == 201 && response.message === "Reject remark created successfully"
        ) {
          this.showNotification(
            'Success',
            'Reject created successfully',
            'success'
          );
          this.activeModal.close('success');
        }
      } catch (error: any) {
        this.showNotification('Error', error, 'error');
        this.isValidForm = false;
      }
    } else {
      this.isValidForm = false;
    }
  }


  closeModal() {
    this.activeModal.close();
  }

  capitalizeReason() {
  const value = this.addReasonForm.get('reason')?.value || '';
  const capitalized = value
    .split(' ')
    .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  this.addReasonForm.get('reason')?.setValue(capitalized, { emitEvent: false });
}


}
