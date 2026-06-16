import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ClientService } from 'src/app/core/service/client/client.service';

@Component({
  selector: 'app-client-edit',
  standalone: false,
  templateUrl: './client-edit.component.html',
  styleUrl: './client-edit.component.scss',
})

export class ClientEditComponent {
  @Input() modalParams: any = {};
  editClientForm!: FormGroup;
  isValidForm!: boolean;
  alphaWithWithSpace = '^[A-Za-z]+([ ]?[A-Za-z])*$';
  emailpattern =
    /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  mobilePattern = '^(?!0{10}$)[0-9]{10}$';
  imagePreview: string | ArrayBuffer | null = null;
  client: any;
  clientUuid: any;
  constructor(
    private activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private clientService: ClientService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isValidForm = true;
    this.editClientForm = this.formBuilder.group({
      name: [
        '',
        [Validators.required, Validators.pattern(this.alphaWithWithSpace)],
      ],
      shortName: ['', [Validators.required]],
      code: ['', [Validators.required]],
      addressLine1: ['', Validators.required],
      addressLine2: ['', [Validators.required]],
      logo: [''],
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
    this.getClientById(this.modalParams.clientuuid);
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

  async getClientById(id: any) {
    try {
      let response = await this.clientService.getClient(id).toPromise();
      if (response) {
        this.client = response;
        this.editClientForm.patchValue({
          name: this.client.name || '',
          shortName: this.client.short_name || '',
          code: this.client.client_code || '',
          addressLine1: this.client.address || '',
          addressLine2: this.client.address_2 || '',
          gstin: this.client.gst_no || '',
          pan: this.client.pan_no || '',
          email: this.client.email_id || '',
          mobile: this.client.mobile_no || '',
          cin: this.client.cin_no || '',
          country: this.client.country || '',
          state: this.client.state || '',
          logo: '',
        });
        this.editClientForm.get('gstin')?.disable();
        this.editClientForm.get('pan')?.disable();
        this.editClientForm.get('code')?.disable();
        if (this.client.profile_logo_url) {
          await this.uploadImageAndSetPreview(this.client.profile_logo_url);
        }
        this.cdRef.detectChanges();
      }
    } catch (error) {}
  }

  async uploadImageAndSetPreview(url: any) {
    try {
      let tempJSON = { file: url };
      const response = await this.clientService
        .getImageUrl(tempJSON)
        .toPromise();
      if (response) {
        this.imagePreview = response.url;
        this.cdRef.detectChanges();
      }
    } catch (error) {}
  }

  async updateClient() {
    if (this.editClientForm.valid) {
      try {
        this.isValidForm = true;
        const formData = new FormData();
        formData.append('name', this.editClientForm.get('name')?.value);
        formData.append(
          'short_name',
          this.editClientForm.get('shortName')?.value
        );
        formData.append('client_code', this.editClientForm.get('code')?.value);
        formData.append(
          'address',
          this.editClientForm.get('addressLine1')?.value
        );
        formData.append(
          'address_2',
          this.editClientForm.get('addressLine2')?.value
        );
        formData.append('profile_logo', this.editClientForm.get('logo')?.value);
        formData.append('gst_no', this.editClientForm.get('gstin')?.value);
        formData.append('pan_no', this.editClientForm.get('pan')?.value);
        formData.append('email_id', this.editClientForm.get('email')?.value);
        formData.append('mobile_no', this.editClientForm.get('mobile')?.value);
        formData.append('cin_no', this.editClientForm.get('cin')?.value);
        formData.append('country', this.editClientForm.get('country')?.value);
        formData.append('state', this.editClientForm.get('state')?.value);
        let response = await this.clientService
          .updateClient(formData, this.modalParams.clientuuid)
          .toPromise();
        if (
          response.status == 200 &&
          response.message == 'Client updated successfully'
        ) {
          this.showNotification(
            'Success',
            'Client updated successfully',
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
    this.editClientForm.get(fieldName)?.setValue(value);
    if (fieldName == 'gstin') {
      this.getPanNumber();
    }
  }

  getPanNumber() {
    if (this.editClientForm.get('gstin')?.valid) {
      let gstNumber: string = this.editClientForm.get('gstin')?.value;
      let pan = gstNumber.substring(2, 12);
      this.editClientForm.get('pan')?.setValue(pan);
    } else {
      this.editClientForm.get('pan')?.setValue('');
    }
  }

  onFileChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      const file = inputElement.files[0];

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 4 * 1024 * 1024;
      this.editClientForm.get('logo')?.setErrors(null);
      if (!allowedTypes.includes(file.type)) {
        this.imagePreview = null;
        inputElement.value = '';
        this.editClientForm.get('logo')?.setErrors({ invalidFileType: true });
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
        this.editClientForm.get('logo')?.setErrors({ invalidFileSize: true });
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

      this.editClientForm.patchValue({ logo: file });
      this.editClientForm.get('logo')?.setErrors(null);
    }
  }

  triggerFileUpload(): void {
    document.getElementById('logo-upload')?.click();
  }

  removeImage(event: MouseEvent): void {
    event.stopPropagation();
    this.imagePreview = null;
    this.editClientForm.patchValue({ logo: '' });
    this.editClientForm.get('logo')?.setErrors({ required: true });
  }
}
