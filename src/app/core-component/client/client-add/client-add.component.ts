import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ClientService } from 'src/app/core/service/client/client.service';

@Component({
  selector: 'app-client-add',
  standalone: false,
  templateUrl: './client-add.component.html',
  styleUrl: './client-add.component.scss',
})

export class ClientAddComponent {
  selectedCountry: string = '';
  addClientForm!: FormGroup;
  isValidForm!: boolean;
  alphaWithWithSpace = '^[A-Za-z]+([ ]?[A-Za-z])*$';
  emailpattern =
    /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  mobilePattern = '^(?!0{10}$)[0-9]{10}$';
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.isValidForm = true;
    this.addClientForm = this.formBuilder.group({
      name: [
        '',
        [Validators.required, Validators.pattern(this.alphaWithWithSpace)],
      ],
      shortName: ['', [Validators.required]],
      code: ['', [Validators.required]],
      addressLine1: ['', Validators.required],
      addressLine2: ['', Validators.required],
      logo: ['', Validators.required],
      gstin: [
        '',
        [
          Validators.required,
          Validators.minLength(15),
          Validators.maxLength(15),
          Validators.pattern(
            '^[0-9]{2}[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}[0-9a-zA-Z]{1}[zZ][0-9A-Za-z]{1}$'
          ),
        ],
      ],
      pan: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
          Validators.pattern('^[a-zA-Z]{5}[0-9]{4}[A-Za-z]{1}$'),
        ],
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
      cin: [
        '',
        [
          Validators.minLength(21),
          Validators.maxLength(21),
          Validators.pattern('^[A-Z0-9]{21}$'),
        ],
      ],
      country: [
        '',
        [Validators.required, Validators.pattern(this.alphaWithWithSpace)],
      ],
      state: [
        '',
        [Validators.required, Validators.pattern(this.alphaWithWithSpace)],
      ],
    });
  }
  
  closeModal() {
    this.activeModal.close();
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

  async saveClient() {
    if (this.addClientForm.valid) {
      try {
        this.isValidForm = true;
        const formData = new FormData();
        formData.append('name', this.addClientForm.get('name')?.value);
        formData.append(
          'short_name',
          this.addClientForm.get('shortName')?.value
        );
        formData.append('client_code', this.addClientForm.get('code')?.value);
        formData.append(
          'address',
          this.addClientForm.get('addressLine1')?.value
        );
        formData.append(
          'address_2',
          this.addClientForm.get('addressLine2')?.value
        );
        formData.append('profile_logo', this.addClientForm.get('logo')?.value);
        formData.append('gst_no', this.addClientForm.get('gstin')?.value);
        formData.append('pan_no', this.addClientForm.get('pan')?.value);
        formData.append('email_id', this.addClientForm.get('email')?.value);
        formData.append('mobile_no', this.addClientForm.get('mobile')?.value);
        formData.append('cin_no', this.addClientForm.get('cin')?.value);
        formData.append('country', this.addClientForm.get('country')?.value);
        formData.append('state', this.addClientForm.get('state')?.value);
        let response = await this.clientService
          .createClient(formData)
          .toPromise();
        if (
          response.status == 200 &&
          response.message == 'Client created successfully'
        ) {
          this.showNotification(
            'Success',
            'Client created successfully',
            'success'
          );
          this.activeModal.close('success');
        } else {
          this.showNotification('Error', response.message, 'error');
        }
      } catch (error: any) {
        this.showNotification('Error', error, 'error');
        this.isValidForm = false;
      }
    } else {
      this.isValidForm = false;
    }
  }

  changeToUpperCase(event: any, fieldName: string) {
    let value: string = event.target.value.toUpperCase();
    this.addClientForm.get(fieldName)?.setValue(value);
    if (fieldName == 'gstin') {
      this.getPanNumber();
    }
  }

  getPanNumber() {
    if (this.addClientForm.get('gstin')?.valid) {
      let gstNumber: string = this.addClientForm.get('gstin')?.value;
      let pan = gstNumber.substring(2, 12);
      this.addClientForm.get('pan')?.setValue(pan);
    } else {
      this.addClientForm.get('pan')?.setValue('');
    }
  }

  onFileChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      const file = inputElement.files[0];

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 4 * 1024 * 1024;
      this.addClientForm.get('logo')?.setErrors(null);
      if (!allowedTypes.includes(file.type)) {
        this.imagePreview = null;
        inputElement.value = '';
        this.addClientForm.get('logo')?.setErrors({ invalidFileType: true });
        this.showNotification(
          'Error',
          'Invalid file type. Only PNG, JPG, JPEG are allowed.',
          'error'
        );
        return;
      }
      if (file.size > maxSize) {
        this.imagePreview = null;
        inputElement.value = '';
        this.addClientForm.get('logo')?.setErrors({ invalidFileSize: true });
        this.showNotification(
          'Error',
          'File is too large. Max 2MB allowed.',
          'error'
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
      this.addClientForm.patchValue({ logo: file });
      this.addClientForm.get('logo')?.setErrors(null);
    }
  }

  triggerFileUpload(): void {
    document.getElementById('logo-upload')?.click();
  }

  removeImage(event: MouseEvent): void {
    event.stopPropagation();
    this.imagePreview = null;
    this.addClientForm.patchValue({ logo: '' });
    this.addClientForm.get('logo')?.setErrors({ required: true });
  }
}
