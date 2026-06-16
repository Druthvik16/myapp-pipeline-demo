import { Component, Input, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProcessService } from 'src/app/core/service/process/process.service';
import { FileService } from 'src/app/core/service/file/file.service';
import Swal from 'sweetalert2';

interface ValidationStep {
  description: string;
  status: 'idle' | 'loading' | 'success' | 'fail';
}

@Component({
  selector: 'app-scanning-process',
  standalone: false,
  templateUrl: './scanning-process.component.html',
  styleUrl: './scanning-process.component.scss',
})
export class ScanningProcessComponent {
  @Input() modalParams: any;
  fileData: any;
  validating = false;
  steps: ValidationStep[] = [
    { description: 'Validate Month and Year', status: 'idle' },
    { description: 'Validate No Blank Present', status: 'idle' },
    { description: 'Validate Brand Present', status: 'idle' },
    { description: 'Data Duplicate Check', status: 'idle' },
  ];
  rejecting: boolean = false;
  uploading: boolean = false;
  fileName: string = '';
  @ViewChild('reasonModal') reasonModal: any;
  rejectionReason: string = '';
  constructor(
    private activeModal: NgbActiveModal,
    private processService: ProcessService,
    private fileService: FileService,
  ) {}

  ngOnInit() {
    this.fileData = this.modalParams.file;
    this.fileName = this.modalParams.fileName;
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

  get allScanned(): boolean {
    return this.steps.every(
      (step) => step.status === 'success' || step.status === 'fail'
    );
  }

  get allValid(): boolean {
    return this.steps.every((step) => step.status === 'success');
  }

  get anyValidated(): boolean {
    return this.steps.some((step) => step.status !== 'idle');
  }

  get step1to3Success(): boolean {
    return (
      this.steps[0].status === 'success' &&
      this.steps[1].status === 'success' &&
      this.steps[2].status === 'success'
    );
  }

  get step4Success(): boolean {
    return this.steps[3].status === 'success';
  }

  get showStep4(): boolean {
    return this.step1to3Success;
  }

  get anyOfStep1to3Failed(): boolean {
    return this.steps.slice(0, 3).some((step) => step.status === 'fail');
  }

  get step4Failed(): boolean {
    return this.steps[3].status === 'fail';
  }

  get showRejectButton(): boolean {
    return this.anyOfStep1to3Failed || this.step4Failed;
  }

  async validateAllSteps(): Promise<void> {
    this.validating = true;
    for (let i = 0; i < 3; i++) {
      await this.runValidation(i);
    }
    this.validating = false;
  }

  async runValidation(index: number): Promise<void> {
    const step = this.steps[index];
    step.status = 'loading';
    try {
      let response: any;
      switch (index) {
        case 0:
          // response = await this.processService
          //   .validateMonthYear(this.modalParams.fileId)
          //   .toPromise();
          response = {status_code:200 , message:true}
          break;
        case 1:
          response = await this.processService
            .validateNoBlank(this.modalParams.fileId)
            .toPromise();
          break;
        case 2:
          response = await this.processService
            .validateBrand(this.modalParams.fileId)
            .toPromise();
          break;
        case 3:
          response = await this.processService
            .validateDuplicate(this.modalParams.fileId)
            .toPromise();
          if (response?.isSuccess === true) {
            step.status = 'success';
          } else {
            step.status = 'fail';
          }
          return;
      }
      if (index !== 3) {
        if (response?.status_code === 200 && response?.message === true) {
          step.status = 'success';
        } else {
          step.status = 'fail';
        }
      }
    } catch (error) {
      step.status = 'fail';
      console.error(`Validation step ${index + 1} failed:`, error);
    }
  }

  async rejectedData() {
    try {
      this.rejecting = true;
      const reasonPhrases: { [index: number]: string } = {
        0: 'Invalid Month/Year',
        1: 'Blank Cells',
        2: 'Invalid Brand',
        3: 'Duplicate Data',
      };
      const failedPhrases: string[] = this.steps
        .map((step, i) => (step.status === 'fail' ? reasonPhrases[i] : null))
        .filter((reason) => reason !== null) as string[];
      let rejectionReason = '';
      if (failedPhrases.length === 1) {
        rejectionReason = `The file contains ${failedPhrases[0]}.`;
      } else if (failedPhrases.length > 1) {
        const last = failedPhrases.pop();
        rejectionReason = `The file contains ${failedPhrases.join(
          ', '
        )} and ${last}.`;
      }
      const allFailed = this.steps.every((step) => step.status === 'fail');
      const duplicateFailed = this.steps[3].status === 'fail';
      if (allFailed) {
        this.fileData.state_id = 7;
      } else if (duplicateFailed) {
        this.fileData.state_id = 5;
      } else {
        this.fileData.state_id = 7;
      }
      const payload = {
        file_id: this.fileData.file_id,
        state_id: this.fileData.state_id,
        status_id: this.fileData.status_id,
        rejectReason: rejectionReason.replace(/\n/g, ' ').trim(),
      };
      const response = await this.fileService
        .updateFileStatus(payload)
        .toPromise();
      if (response && response.message === 'File updated successfully') {
        this.activeModal.close('success');
        this.showNotification(
          'Success',
          'File Updated successfully',
          'success'
        );
      }
    } catch (error: any) {
      this.showNotification('Error', error, 'error');
    } finally {
      this.rejecting = false;
    }
  }

  async updateData() {
    try {
      this.uploading = true;
      this.fileData.state_id = 6;
      this.fileData.status_id = 2;
      let response = await this.fileService
        .updateFileData(this.fileData)
        .toPromise();
      if (response && response.message === 'File updated successfully') {
        let res = await this.processService
          .insertData(this.modalParams.fileId)
          .toPromise();
        if (res.message === 'success') {
          this.activeModal.close('success');
          this.showNotification(
            'Success',
            'File Updated successfully',
            'success'
          );
        }
      }
    } catch (error: any) {
      this.showNotification('Error', error, 'error');
    } finally {
      this.uploading = false;
    }
  }

  submitReason(modal: any) {
    if (!this.rejectionReason.trim()) {
      this.showNotification('Warning', 'Please enter a reason.', 'warning');
      return;
    }
    modal.close();
  }

  closeModal() {
    if (this.step4Failed) {
      this.activeModal.close('step4-failed');
      this.showNotification('Success', 'File Updated successfully', 'success');
    } else {
      this.activeModal.close();
    }
  }
  
}
