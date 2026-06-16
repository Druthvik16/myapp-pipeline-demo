import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from 'src/app/core/service/user/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-staff-edit',
  standalone: false,
  templateUrl: './staff-edit.component.html',
  styleUrl: './staff-edit.component.scss',
})
export class StaffEditComponent {
  @Input() modalParams: any;
  statusList = [
    { id: 1, name: 'Active' },
    { id: 0, name: 'Inactive' },
  ];
  editStaffForm!: FormGroup;
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
    this.editStaffForm = this.formBuilder.group({
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
    if (this.modalParams?.staff) {
      const staff = this.modalParams.staff;
      this.editStaffForm.patchValue({
        name: staff.staff_name,
        email: staff.email_id,
        mobile: staff.mobile_no,
        status: {
          id: staff.is_active,
        },
      });
    }
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

  async updateStaff() {
    if (this.editStaffForm.valid) {
      try {
        this.isValidForm = true;
        const payload = {
          staff_name: this.editStaffForm.get('name')?.value,
          mobile_no: this.editStaffForm.get('mobile')?.value,
          is_active: this.editStaffForm.get('status.id')?.value,
          email_id : this.editStaffForm.get('email')?.value
        };
        let response = await this.userService
          .updateStaff(payload, this.modalParams?.staff.id)
          .toPromise();
        if (
          response.status_code == 200 &&
          response.message == 'Staff updated successfully'
        ) {
          this.showNotification(
            'Success',
            'Staff updated successfully',
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
