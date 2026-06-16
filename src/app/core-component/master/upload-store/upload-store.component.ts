import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ClientService } from 'src/app/core/service/client/client.service';
import { StoreService } from 'src/app/core/service/store/store.service';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';

@Component({
  selector: 'app-upload-store',
  standalone: false,
  templateUrl: './upload-store.component.html',
  styleUrl: './upload-store.component.scss',
})
export class UploadStoreComponent {
  uploadStoreForm!: FormGroup;
  isValidForm!: boolean;
  saveClicked!: boolean;
  clients: any = [];
  templateName = 'store-template.xlsx';
  downloadFileName = 'uploaded-store.xlsx'
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
    this.uploadStoreForm = this.formBuilder.group({
      selectedFile: [''],
      storeFile: ['', [Validators.required]],
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
        this.uploadStoreForm.get('storeFile')?.setValue('');
        this.uploadStoreForm.get('selectedFile')?.setValue('');
      } else {
        this.uploadStoreForm.get('selectedFile')?.setValue(file);
      }
    } else {
      this.uploadStoreForm.get('selectedFile')?.setValue('');
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
        .getBulkImportTemplate()
        .toPromise();
      if (response) {
        this.commonSharedService.downloadBlobFile(response, this.templateName);
      }
    } catch (e) {}
  }

  async scanStoreFile() {
    if (this.uploadStoreForm.valid) {
      try {
        this.saveClicked = true;
        let formaData = new FormData();
        formaData.append(
          'file',
          this.uploadStoreForm.get('selectedFile')?.value
        );
        formaData.append(
          'client_uuid',
          this.uploadStoreForm.get('clientUuid')?.value
        );
        let response = await this.storeService
          .addStoreBulk(formaData)
          .toPromise();
        if (response) {
          this.saveClicked = false;
          this.commonSharedService.downloadBlobFile(response, this.downloadFileName);
          this.showNotification(
            'success',
            'Store Successfully Uploaded',
            'success'
          );
          this.uploadStoreForm.reset();
          this.commonSharedService.StoreListObject.next({ result: 'success' });
          this.activeModal.close();
          this.uploadStoreForm.get('storeFile')?.setValue('');
          this.uploadStoreForm.get('selectedFile')?.setValue('');
        } else {
          this.saveClicked = false;
          this.showNotification('Error', 'Uploading Failed', 'error');
          this.uploadStoreForm.get('storeFile')?.setValue('');
          this.uploadStoreForm.get('selectedFile')?.setValue('');
        }
      } catch (error) {
        this.saveClicked = false;
        this.uploadStoreForm.get('storeFile')?.setValue('');
        this.uploadStoreForm.get('selectedFile')?.setValue('');
        this.showNotification('Error', 'Scanning Failed, ' + error, 'error');
      }
    } else {
      this.isValidForm = false;
    }
  }

  closeModal() {
    this.activeModal.close();
  }
}
