import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-upload-portal-mapping',
  standalone: false,
  templateUrl: './upload-portal-mapping.component.html',
  styleUrl: './upload-portal-mapping.component.scss'
})
export class UploadPortalMappingComponent {

  portalFileForm!: FormGroup;
  orderFileKeys: { [key: string]: string } = {};
  dynamicKeys: string[] = [];
  alphaWithWithSpace = '^[A-Za-z]+([ ]?[A-Za-z])*$';
  isValidForm!: boolean;
  @ViewChild('fileInput') fileInput!: ElementRef;
  selectedFile: any = null
  isMappingUpload = false;
  requiredValues: any = [];
  isUploadMapping = false;
  destinationHeader: string = '';
  portalHeader: string = '';
  @Input() modalParams: any;

  constructor(
    private formBuilder: FormBuilder,
    private activeModal: NgbActiveModal,
  ) { }

  ngOnInit(): void {
    this.portalFileForm = this.formBuilder.group({
      selectedFile: ["", [Validators.required]],
    });
    this.isMappingUpload = false;
    this.isValidForm = true;
    this.destinationHeader = "System Headers";
    this.portalHeader = "Product Headers";
    this.requiredValues = this.modalParams.code == 'uploadMapping' ? Object.values(this.modalParams?.orderFileKeys) : {}
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

  onFileChange(file: any) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      const headers: string[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = sheet[cellAddress];
        if (cell && cell.v) {
          headers.push(cell.v.toString());
        }
      }
      if (!headers.includes(this.destinationHeader) || !headers.includes(this.portalHeader)) {
        this.showNotification(
          "Error",
          `Missing required columns: '${this.destinationHeader}' and '${this.portalHeader}'. Found: ${headers.join(', ')}`,
          'error'
        );
        this.portalFileForm.get("selectedFile")?.setValue("");
        this.closeModal({ result: false, code: this.modalParams.code });
        return;
      }
      const jsonData: any = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (jsonData.length === 0) {
        this.showNotification("Error", `No data found in file`, 'error');
        this.portalFileForm.get("selectedFile")?.setValue("");
        this.closeModal({ result: false, code: this.modalParams.code });
        return;
      }
      this.createJson(jsonData);
    };
    reader.readAsArrayBuffer(file);
  }


  createJson(data: any[]) {
    const orderFormat: any = {};
    const requiredSystemHeaders = ["Style Code", "MRP", "EAN"];
    const missingMappings: string[] = [];
    data.forEach(row => {
      const systemHeader = row[this.destinationHeader];
      const productHeader = row[this.portalHeader] ?? '';
      if (systemHeader && systemHeader.trim() !== '') {
        orderFormat[systemHeader] = {
          value: productHeader,
          status: false
        };
        if (requiredSystemHeaders.includes(systemHeader)) {
          if (!productHeader || productHeader.trim() === '') {
            missingMappings.push(systemHeader);
          }
        }
      }
    });
    if (missingMappings.length > 0) {
      this.showNotification(
        "Mapping Required",
        `The following mandatory field(s) must have a Product Header mapping: ${missingMappings.join(", ")}`,
        "error"
      );
      this.portalFileForm.get("selectedFile")?.setValue("");
      this.closeModal({ result: false, code: this.modalParams.code });
      return;
    }
    this.closeModal({
      result: true,
      code: this.modalParams.code,
      orderFormat
    });
  }



  checkFile(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type != "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        this.showNotification("Warning", "Accept only .xlsx file", "warning");
        this.portalFileForm.get("selectedFile")?.setValue("");
      }
      else {
        if (this.modalParams.code == 'uploadMapping') this.onFileChange(file)
        !this.isUploadMapping ? this.portalFileForm.get("selectedFile")?.setValue(file) : this.portalFileForm.get("selectedFile")?.setValue("");
      }
    }
    else {
      this.portalFileForm.get("selectedFile")?.setValue("");
    }
  }


  submitForm() {
    if (this.modalParams.code == 'validateMapping') {
      this.closeModal({ result: true, code: this.modalParams.code, file: this.portalFileForm.get("selectedFile")?.value })
    }
  }

  closeModal(result: any) {
    if (result === false) {
      this.portalFileForm.get("selectedFile")?.setValue("");
    }
    this.activeModal.close(result);
  }

}
