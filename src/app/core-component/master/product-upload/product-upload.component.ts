import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from 'src/app/core/service/client/client.service';
import Swal from 'sweetalert2';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import { ProductService } from 'src/app/core/service/product/product.service';

@Component({
  selector: 'app-product-upload',
  standalone: false,
  templateUrl: './product-upload.component.html',
  styleUrl: './product-upload.component.scss'
})
export class ProductUploadComponent {

  uploadProductForm!: FormGroup;
  isValidForm!: boolean;
  saveClicked!: boolean;
  clients: any = [];
  templateName = 'product-template.xlsx';
  downloadFileName = 'uploaded-product.xlsx'

  constructor(
    private activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private clientService: ClientService,
    private commonSharedService: CommonSharedService,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.isValidForm = true;
    this.saveClicked = false;
    this.uploadProductForm = this.formBuilder.group({
      selectedFile: [''],
      productFile: ['', [Validators.required]],
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
        this.uploadProductForm.get('productFile')?.setValue('');
        this.uploadProductForm.get('selectedFile')?.setValue('');
      } else {
        this.uploadProductForm.get('selectedFile')?.setValue(file);
      }
    } else {
      this.uploadProductForm.get('selectedFile')?.setValue('');
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


  async scanProductFile() {
    if (this.uploadProductForm.valid) {
      try {
        this.saveClicked = true;
        let formaData = new FormData();
        formaData.append(
          'file',
          this.uploadProductForm.get('selectedFile')?.value
        );
        formaData.append(
          'client_uuid',
          this.uploadProductForm.get('clientUuid')?.value
        );
        let response = await this.productService
          .uploadProducts(formaData)
          .toPromise();
        if (response) {
          this.saveClicked = false;
          this.commonSharedService.downloadBlobFile(response, this.downloadFileName);
          this.showNotification(
            'success',
            'Products Successfully Uploaded',
            'success'
          );
          this.uploadProductForm.reset();
          this.commonSharedService.ProductListObject.next({ result: 'success' });
          this.activeModal.close();
          this.uploadProductForm.get('productFile')?.setValue('');
          this.uploadProductForm.get('selectedFile')?.setValue('');
        } else {
          this.saveClicked = false;
          this.showNotification('Error', 'Uploading Failed', 'error');
          this.uploadProductForm.get('productFile')?.setValue('');
          this.uploadProductForm.get('selectedFile')?.setValue('');
        }
      } catch (error) {
        this.saveClicked = false;
        this.uploadProductForm.get('productFile')?.setValue('');
        this.uploadProductForm.get('selectedFile')?.setValue('');
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
