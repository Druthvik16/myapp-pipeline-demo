import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from 'src/app/core/service/client/client.service';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import { StoreService } from 'src/app/core/service/store/store.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-bulk-brand-import',
  standalone: false,
  templateUrl: './bulk-brand-import.component.html',
  styleUrl: './bulk-brand-import.component.scss',
})
export class BulkBrandImportComponent {
  uploadBrandForm!: FormGroup;
  isValidForm!: boolean;
  saveClicked!: boolean;
  clients: any = [];
  templateName = 'brand-template.xlsx';
  downloadFileName = 'brand-failed.xlsx';

  constructor(
    private activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private clientService: ClientService,
    private storeService: StoreService,
    private commonSharedService: CommonSharedService
  ) {}

  ngOnInit(): void {
    this.isValidForm = true;
    this.saveClicked = false;
    this.uploadBrandForm = this.formBuilder.group({
      selectedFile: [''],
      brandFile: ['', [Validators.required]],
      clientUuid: ['', [Validators.required]],
    });
    this.getClients();
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

  checkFile(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (
        file.type !=
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        this.showNotification('Warning', 'Accept only .xlsx file', 'warning');
        this.uploadBrandForm.get('storeFile')?.setValue('');
        this.uploadBrandForm.get('selectedFile')?.setValue('');
      } else {
        this.uploadBrandForm.get('selectedFile')?.setValue(file);
      }
    } else {
      this.uploadBrandForm.get('selectedFile')?.setValue('');
    }
  }

  async getClients() {
    try {
      let response = await this.clientService.getClients().toPromise();
      if (response) {
        this.clients = [{ uuid: '', name: 'Select Client' }, ...response];
      }
    } catch (error) {
      this.clients = [];
      this.clients.unshift({ uuid: '', name: 'Select Client' });
    }
  }

  async downloadTemplate() {
    try {
      let response = await this.storeService
        .getBulkImportTemplateBrand()
        .toPromise();
      if (response) {
        this.commonSharedService.downloadBlobFile(response, this.templateName);
      }
    } catch (e) {}
  }

  async scanBrandFile() {
    if (this.uploadBrandForm.valid) {
      try {
        this.saveClicked = true;
        let formaData = new FormData();
        formaData.append(
          'file',
          this.uploadBrandForm.get('selectedFile')?.value
        );
        formaData.append(
          'client_uuid',
          this.uploadBrandForm.get('clientUuid')?.value
        );
        let response = await this.storeService
          .addBrandBulk(formaData)
          .toPromise();
        if (response) {
          this.saveClicked = false;
          this.showNotification(
            'success',
            'Brand Updated Successfully',
            'success'
          );
          this.uploadBrandForm.reset();
          this.activeModal.close();
          this.uploadBrandForm.get('brandFile')?.setValue('');
          this.uploadBrandForm.get('selectedFile')?.setValue('');
        } else {
          this.saveClicked = false;
          this.showNotification('Error', 'Uploading Failed', 'error');
          this.uploadBrandForm.get('brandFile')?.setValue('');
          this.uploadBrandForm.get('selectedFile')?.setValue('');
        }
      } catch (error: any) {
        this.saveClicked = false;
        this.uploadBrandForm.get('brandFile')?.setValue('');
        this.uploadBrandForm.get('selectedFile')?.setValue('');
        if (error.status === 400 && error.error instanceof Blob) {
          this.commonSharedService.downloadBlobFile(
            error.error,
            this.downloadFileName
          );
          this.showNotification(
            'error',
            'Upload failed. Please check the downloaded file.',
            'error'
          );
        }
        if (error.status === 500) {
          this.showNotification('error', 'Upload failed: ' + error, 'error');
        }
      }
    } else {
      this.isValidForm = false;
    }
  }

  closeModal() {
    this.activeModal.close();
  }
}
