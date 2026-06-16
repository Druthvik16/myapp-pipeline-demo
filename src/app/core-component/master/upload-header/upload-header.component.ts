import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { HeaderService } from 'src/app/core/service/header/header.service';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';

@Component({
  selector: 'app-upload-header',
  standalone: false,
  templateUrl: './upload-header.component.html',
  styleUrl: './upload-header.component.scss',
})
export class UploadHeaderComponent {
  uploadHeaderForm!: FormGroup;
  isValidForm!: boolean;
  saveClicked!: boolean;
  templateName = 'header-template.xlsx'

  headerValidationResults: { header: string; matched: boolean }[] = [];
  constructor(
    private activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private headerService: HeaderService,
    private commonSharedService: CommonSharedService
  ) {}

  ngOnInit(): void {
    this.isValidForm = true;
    this.saveClicked = false;
    this.uploadHeaderForm = this.formBuilder.group({
      selectedFile: [''],
      headerFile: ['', [Validators.required]],
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

  checkFile(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (
        file.type !==
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        this.showNotification('Warning', 'Accept only .xlsx file', 'warning');
        this.uploadHeaderForm.get('headerFile')?.setValue('');
        this.uploadHeaderForm.get('selectedFile')?.setValue('');
        return;
      } else {
        this.uploadHeaderForm.get('selectedFile')?.setValue(file);
      }
    } else {
      this.uploadHeaderForm.get('selectedFile')?.setValue('');
    }
  }

  async downloadTemplate() {
    try {
      let response = await this.headerService.getHeaderTemplate().toPromise();
      if (response) {
        this.commonSharedService.downloadBlobFile(response, this.templateName);
      }
    } catch (e) {}
  }

  async scanHeaderFile() {
    if (this.uploadHeaderForm.valid) {
      try {
         this.saveClicked = true;
         let formaData = new FormData();
         formaData.append("file", this.uploadHeaderForm.get("selectedFile")?.value);
         let response = await this.headerService.uploadHeader(formaData).toPromise();
          if (response) {
             this.saveClicked = false;
              this.showNotification("success", "Headers Successfully Uploaded", "success")
              this.uploadHeaderForm.reset();
              this.commonSharedService.HeaderListObject.next({ "result": "success" })
              this.activeModal.close()
              this.uploadHeaderForm.get("headerFile")?.setValue("");
               this.uploadHeaderForm.get("selectedFile")?.setValue("");
          }else{
            this.saveClicked = false;
           this.showNotification("Error", "Uploading Failed", 'error');
           this.uploadHeaderForm.get("headerFile")?.setValue("");
          this.uploadHeaderForm.get("selectedFile")?.setValue("");
          }
      } catch (error) {
        this.saveClicked = false;
        this.uploadHeaderForm.get("headerFile")?.setValue("");
        this.uploadHeaderForm.get("selectedFile")?.setValue("");
        this.showNotification("Error", "Scanning Failed, " + error, 'error');
      }
    }else{
      this.isValidForm = false;
    }
  }
  closeModal() {
    this.activeModal.close();
  }
}
