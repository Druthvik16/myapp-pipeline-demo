import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from 'src/app/core/service/product/product.service';
import Swal from 'sweetalert2';
import { exportJsonToXlsx } from 'src/app/core/service/excel/excel.service';
import { UploadPortalMappingComponent } from '../upload-portal-mapping/upload-portal-mapping.component';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';

@Component({
  selector: 'app-product-header-mapping-add',
  standalone: false,
  templateUrl: './product-header-mapping-add.html',
  styleUrl: './product-header-mapping-add.scss',
})
export class ProductHeaderMappingAdd {
  orderFileKeys: { [key: string]: string } = {};
  orderFormatKeys: { [key: string]: any } = {};
  paymentFileKeys: { [key: string]: string } = {};
  dynamicKeys: string[] = [];
  alphaWithWithSpace = '^[A-Za-z]+([ -_]?[A-Za-z])*$';
  isValidForm!: boolean;
  @ViewChild('fileInput') fileInput!: ElementRef;
  selectedFile: any = null;
  isValidated: boolean = false;
  isUploadMapping: boolean = false;
  portals: any = [];
  clientUuid: string = '';

  constructor(
    private activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private productService: ProductService,
    private commonSharedService: CommonSharedService
  ) {}

  ngOnInit(): void {
    this.isValidated = false;
    this.isValidForm = true;
    const storedClient = this.commonSharedService.selectedClientUUID.value;
    if (storedClient?.result && storedClient.uuid) {
      this.clientUuid = storedClient.uuid;
    }
    this.fetchJsonFormat();
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

  getKeyRows(keys: any): string[][] {
    const rows: string[][] = [];
    let tempRow: string[] = [];
    Object.keys(keys).forEach((key, index) => {
      tempRow.push(key);
      if ((index + 1) % 4 === 0 || index === Object.keys(keys).length - 1) {
        rows.push(tempRow);
        tempRow = [];
      }
    });

    return rows;
  }

  downloadMappingFormat() {
    exportJsonToXlsx(this.orderFileKeys);
  }

  async fetchJsonFormat() {
    try {
      const response = await this.productService.getJsonFormat().toPromise();
      if (response) {
        this.orderFileKeys = response.data.productHeaders;
      }
    } catch (error) {
      console.error('Error fetching JSON format:', error);
      this.orderFileKeys = {};
      this.paymentFileKeys = {};
    }
  }

  uploadMappingFormat() {
    this.isUploadMapping = false;
    this.isValidated = false;
    const modalRef = this.modalService.open(UploadPortalMappingComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
      scrollable: false,
    });
    modalRef.componentInstance.modalParams = {
      modalName: 'Upload Mapping File',
      code: 'uploadMapping',
      orderFileKeys: this.orderFileKeys,
    };
    modalRef.result.then(
      (result) => {
        if (result.result && result.code == 'uploadMapping') {
          this.isUploadMapping = true;
          this.orderFormatKeys = result.orderFormat;
        } else {
          this.isUploadMapping = false;
        }
      },
      () => {}
    );
  }

  uploadValidateMapping() {
    this.isValidated = false;
    if (this.isUploadMapping) {
      const modalRef = this.modalService.open(UploadPortalMappingComponent, {
        size: 'lg',
        backdrop: 'static',
        centered: true,
        scrollable: false,
      });
      modalRef.componentInstance.modalParams = {
        modalName: 'Upload Validate Mapping File',
        code: 'validateMapping',
      };
      modalRef.result.then(
        (result) => {
          if (result.result && result.code == 'validateMapping') {
            this.validateMapping(result.file);
          }
        },
        () => {}
      );
    } else {
      this.isValidForm = false;
      this.showNotification(
        'Error',
        'Please enter required details or upload mapping',
        'error'
      );
    }
  }

  async validateMapping(file: any) {
    this.selectedFile = file;
    try {
      const formData = new FormData();
      formData.append('uploadFile', file);
      let orderScannedJson: { [key: string]: string } = {};
      Object.keys(this.orderFileKeys).forEach((key) => {
        orderScannedJson[key] = this.orderFormatKeys[key].value || '';
      });
      this.isValidForm = true;
      formData.append('header_mapping_json', JSON.stringify(orderScannedJson));
      formData.append('client_uuid', this.clientUuid);
      let response = await this.productService
        .validateMappingFile(formData)
        .toPromise();
      if (response) {
        this.isValidated = true;
        this.showNotification('Success', response.message, 'success');
        Object.keys(this.orderFormatKeys).find((key) => {
          this.orderFormatKeys[key].status = true;
        });
      } else {
        this.isValidated = false;
        this.showNotification('Error', 'Saving Failed', 'error');
      }
    } catch (error: any) {
      this.isValidated = false;
      const errorMessage = (
        error?.error?.message ||
        error?.message ||
        error ||
        ''
      ).toString();
      if (errorMessage.includes('Missing headers: ')) {
        const headerString = error.split('Missing headers: ')[1];
        const portalHeaders = headerString.split(', ');
        portalHeaders.forEach((value: any) => {
          Object.keys(this.orderFormatKeys).find((key) => {
            if (this.orderFormatKeys[key].value === value) {
              this.orderFormatKeys[key].status = false;
            } else {
              this.orderFormatKeys[key].status = true;
            }
          });
        });
      }
      this.selectedFile = '';
      this.showNotification('Error', 'Uploading Failed, ' + error, 'error');
    }
  }

  setOrderKeys() {
    Object.keys(this.orderFileKeys).forEach((key) => {
      this.orderFormatKeys[this.orderFileKeys[key]] = {
        value: '',
        status: false,
      };
    });
  }

  async saveHeaderMapping() {
    if (this.isValidated) {
      try {
        const formData = new FormData();
        formData.append('uploadFile', this.selectedFile);
        let orderScannedJson: { [key: string]: string } = {};
        Object.keys(this.orderFileKeys).forEach((key) => {
          orderScannedJson[key] = this.orderFormatKeys[key].value || '';
        });
        formData.append(
          'header_mapping_json',
          JSON.stringify(orderScannedJson)
        );
        formData.append('client_uuid', this.clientUuid);
        let response = await this.productService
          .saveProduct(formData)
          .toPromise();
        if (response) {
          this.showNotification('Success', response.message, 'success');
          this.isValidated = false;
          this.isUploadMapping = false;
          this.selectedFile = '';
          this.closeModal({ result: true });
        } else {
          this.showNotification('Error', 'Saving Failed', 'error');
        }
      } catch (error) {
        this.isValidated = false;
        this.isUploadMapping = false;
        this.selectedFile = '';
        this.showNotification('Error', 'Uploading Failed, ' + error, 'error');
      }
    }
  }

  closeModal(result: any) {
    this.activeModal.close(result);
  }
}
