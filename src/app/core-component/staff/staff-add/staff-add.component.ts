import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from 'src/app/core/service/user/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-staff-add',
  standalone: false,
  templateUrl: './staff-add.component.html',
  styleUrl: './staff-add.component.scss',
})
export class StaffAddComponent {
  statusList = [
    { id: 1, name: 'Active' },
    { id: 0, name: 'Inactive' },
  ];
  addStaffForm!: FormGroup;
  alphaWithWithSpace = '^[A-Za-z]+([ ]?[A-Za-z])*$';
  emailpattern =
    /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  mobilePattern = '^(?!0{10}$)[0-9]{10}$';
  isValidForm!: boolean;
  statuses: any = [];
  constructor(
    private activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.isValidForm = true;
    this.addStaffForm = this.formBuilder.group({
      name: [
        '',
        [Validators.required, Validators.pattern(this.alphaWithWithSpace)],
      ],
      email: ['', [Validators.required, Validators.pattern(this.emailpattern)]],
      mobile: [
        '',
        [
          Validators.required,
          Validators.pattern(this.mobilePattern),
          Validators.minLength(10),
        ],
      ],
      status: this.formBuilder.group({
        id: ['', Validators.required],
      }),
    });
    this.getStatusList();
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
    if (this.addStaffForm.valid) {
      try {
        this.isValidForm = true;
        const payload = {
          staff_name: this.addStaffForm.get('name')?.value,
          email_id: this.addStaffForm.get('email')?.value,
          mobile_no: this.addStaffForm.get('mobile')?.value,
          is_active: this.addStaffForm.get('status.id')?.value,
        };
        let response = await this.userService.createStaff(payload).toPromise();
        if (
          response.status_code == 200 &&
          response.message == 'Staff created successfully'
        ) {
          this.showNotification(
            'Success',
            'Store created successfully',
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

  getStatusList() {
    this.statuses = [...this.statusList];
    this.statuses.unshift({ id: '', name: 'Select Status' });
  }

  closeModal() {
    this.activeModal.close();
  }
}
