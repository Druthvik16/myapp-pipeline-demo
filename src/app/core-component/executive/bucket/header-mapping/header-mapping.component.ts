import { ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { routes } from 'src/app/core/helpers/routes';
import { HeaderMappingFormatterComponent } from '../header-mapping-formatter/header-mapping-formatter.component';
import { UserService } from 'src/app/core/service/user/user.service';
import { FileService } from 'src/app/core/service/file/file.service';
import Swal from 'sweetalert2';
import { HeaderService } from 'src/app/core/service/header/header.service';
import { MasterService } from 'src/app/core/service/master/master.service';

@Component({
  selector: 'app-header-mapping',
  standalone: false,
  templateUrl: './header-mapping.component.html',
  styleUrl: './header-mapping.component.scss',
})
export class HeaderMappingComponent {
  @Input() modalParams: any;
  loading: boolean = false;
  public routes = routes;
  isShowExcelEditor: boolean = false;
  fileData: any;
  headerMappings: { standard: string; mapped: string }[] = [];
  mappedHeaders: any;
  rejectedDatasSend: any;
  saveClicked: boolean = false;
  fileName: any;
  @ViewChild('reasonModal') reasonModal: any;
  rejectionReason: string = '';
  headerLists: any;
  // File lock mechanism properties
  private pollingInterval: any;
  isFileLocked: boolean = false;
  lockMessage: string = '';
  userData: any;
  reasonsLists: any = [];

  constructor(
    private activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private userService: UserService,
    private fileService: FileService,
    private cdRef: ChangeDetectorRef,
    private headerService: HeaderService,
    private masterService: MasterService
  ) {}

  async ngOnInit() {
    this.userData = JSON.parse(sessionStorage.getItem('LOGINUSER') || '{}');
    this.fileName = this.modalParams.fileName;
    await this.getMappedHeaders(this.modalParams.fileId);
    await this.getFileDataOnce(this.modalParams.fileId);
    await this.getHeaderList();
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

  async getFileDataOnce(fileId: any) {
    if (!this.fileData || !this.fileData.data) {
      try {
        const response = await this.fileService.getFileData(fileId).toPromise();
        if (response) {
          this.fileData = response;
          if (this.fileData?.state_id !== 2) {
            this.activeModal.close('forceReload');
            this.showNotification(
              'info',
              'This file was already edited successfully.',
              'info'
            );
            return;
          }
          this.isFileLocked = response.locked || false;
          if (this.isFileLocked) {
            this.lockMessage = 'File is currently being edited by another user';
          }
          if (!this.isFileLocked) {
            this.startFileAccessPolling();
          }
        }
      } catch (error) {
        console.error('Error fetching file data once:', error);
      }
    }
  }

  async getMappedHeaders(fileid: any) {
    try {
      this.loading = true;
      let response = await this.userService
        .getMappedHeaders(fileid)
        .toPromise();
      if (response) {
        this.mappedHeaders = response;
        this.loading = false;
      }
    } catch (error) {
      this.mappedHeaders = [];
      this.loading = false;
    } finally {
      this.loading = false;
    }
  }

  async getHeaderList() {
    try {
      const response = await this.headerService.getHeaderLists().toPromise();
      if (response) {
        this.headerLists = response;
      }
    } catch (error) {}
  }

  openHeaderMappingFormatter(header: string, standardHeader: string) {
    (document.activeElement as HTMLElement)?.blur();
    const dialogRef = this.modalService.open(HeaderMappingFormatterComponent, {
      backdrop: 'static',
      modalDialogClass: 'modal-fullscreen',
    });
    dialogRef.componentInstance.modalParams = {
      fieldId: this.modalParams.fileId,
      selectedHeader: header,
      standardHeader: standardHeader,
      allMappedHeaders: this.mappedHeaders,
      fileName: this.fileName,
      fileData: this.fileData,
      headerLists: this.headerLists,
      fileLocked: this.isFileLocked,
      lockMessage: this.lockMessage,
    };
    dialogRef.closed.subscribe((result: any) => {
      if (!result) return;
      if (result.updatedData) {
        this.fileData = result.updatedData;
      }
      if (result.removedHeader) {
        const headerObj = this.mappedHeaders.find(
          (item: any) => item.mapped_file_header === result.removedHeader
        );
        if (headerObj) {
          headerObj.mapped_file_header = '';
        }
      }
      if (result.newMappedHeader && result.standardHeader) {
        const headerObj = this.mappedHeaders.find(
          (item: any) => item.standard_header === result.standardHeader
        );
        if (headerObj) {
          headerObj.mapped_file_header = result.newMappedHeader;
        }
      }
      if (result === 'forceReload') {
        this.showNotification(
          'info',
          'This file was already edited successfully.',
          'info'
        );
        return;
      }
      this.cdRef.detectChanges();
    });
  }

  async saveMappedData() {
    try {
      this.saveClicked = true;
      if (!this.fileData || !this.fileData.data) {
        const response = await this.fileService
          .getFileData(this.modalParams.fileId)
          .toPromise();
        if (response) {
          this.fileData = response;
        } else {
          return;
        }
      }
      const originalFirstRow = { ...this.fileData.data[0] };
      const mappedRow: { [key: string]: string } = {};
      const naMappings: { [key: string]: string } = {};
      const seenHeaders = new Set<string>();
      this.mappedHeaders.forEach((item: any) => {
        if (item.mapped_file_header === 'N/A') {
          const naKey = item.standard_header + '-NA';
          naMappings[item.standard_header] = naKey;
        } else if (
          item.mapped_file_header &&
          !seenHeaders.has(item.mapped_file_header)
        ) {
          mappedRow[item.mapped_file_header] = item.standard_header;
          seenHeaders.add(item.mapped_file_header);
        }
      });
      const fallbackLabels: { [key: string]: string } = {
        Remark: 'Remark',
        'DateMonthYear-Month': 'Month',
        'DateMonthYear-Year': 'Year',
        Instance: 'Instance',
      };
      const transformedRow: { [key: string]: string } = {};
      Object.keys(originalFirstRow).forEach((key) => {
        if (mappedRow[key]) {
          transformedRow[key] = mappedRow[key];
        } else if (fallbackLabels[key]) {
          transformedRow[key] = fallbackLabels[key];
        } else {
          transformedRow[key] = '';
        }
      });
      Object.entries(naMappings).forEach(([standard, naKey]) => {
        transformedRow[naKey] = standard;
      });
      const headerAlreadyExists = Object.values(transformedRow).every((value) =>
        Object.values(this.fileData.data[0] || {}).includes(value)
      );
      if (!headerAlreadyExists) {
        this.fileData.data.unshift(transformedRow);
        for (let i = 1; i < this.fileData.data.length; i++) {
          const row = this.fileData.data[i];
          Object.values(naMappings).forEach((naKey) => {
            row[naKey] = '';
          });
        }
      }
      this.fileData.state_id = 3;
      const response = await this.fileService
        .updateFileData(this.fileData)
        .toPromise();
      if (response && response.message === 'File updated successfully') {
        this.saveClicked = false;
        this.showNotification(
          'Success',
          'File updated successfully',
          'success'
        );
        this.activeModal.close('success');
      } else {
        this.saveClicked = false;
      }
    } catch (error: any) {
      this.saveClicked = false;
      this.showNotification('Error', error, 'error');
    }
  }

  async rejectWithReason() {
    this.rejectionReason = '';
    await this.getReasons();
    const modalRef = this.modalService.open(this.reasonModal, {
      backdrop: 'static',
      size: 'md',
      centered: true,
    });
    try {
      const result = await modalRef.result;
      if (result !== 'confirmed') return;
      this.fileData.state_id = 7;
      const payload = {
        file_id: this.fileData.file_id,
        state_id: this.fileData.state_id,
        status_id: this.fileData.status_id,
        rejectReason: this.rejectionReason.replace(/\n/g, ' ').trim(),
      };
      let response = await this.fileService
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
      if (error !== 'user-cancelled') {
        this.rejectedDatasSend = [];
        this.showNotification('Error', error, 'error');
      }
    }
  }

  submitReason(modal: any) {
    if (!this.rejectionReason.trim()) {
      this.showNotification('Warning', 'Please select a rejection reason.', 'warning');
      return;
    }
    modal.close('confirmed');
  }

  get allHeadersMapped(): boolean {
    return this.mappedHeaders?.every(
      (header: any) =>
        header.mapped_file_header && header.mapped_file_header.trim() !== ''
    );
  }

  closeReasonModal(modal: any) {
    modal.dismiss('user-cancelled');
  }

  // File lock mechanism methods
  private async removeFileAccess(): Promise<void> {
    try {
      if (this.fileData && this.fileData.file_id) {
        const response = await this.fileService
          .removeFileAcessStatus(this.fileData.file_id)
          .toPromise();
        if (
          response &&
          response.message === 'File access removed successfully'
        ) {
          console.log('File access removed successfully');
        }
      }
    } catch (error) {
      console.error('Error removing file access:', error);
    }
  }

  private startFileAccessPolling(): void {
    if (this.fileData?.locked) {
      console.log('Polling not started: file is locked.');
      return;
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.updateFileAccessStatus();
    this.pollingInterval = setInterval(() => {
      this.updateFileAccessStatus();
    }, 8000);
  }

  private async updateFileAccessStatus(): Promise<void> {
    try {
      if (this.fileData && this.fileData.file_id) {
        const response = await this.fileService
          .updateFileAcessStatus(this.fileData.file_id)
          .toPromise();
        if (response && response.message === 'File accessed successfully') {
          console.log('File access status updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating file access status:', error);
    }
  }

  get areButtonsDisabled(): boolean {
    return this.isFileLocked || this.saveClicked;
  }

  async getReasons() {
    try {
      let response = await this.masterService.getRejectList().toPromise();
      if (response.status === 200 && response.message === "success") {
        this.reasonsLists = response.data;
      }
    } catch (error) {
      this.reasonsLists = [];
    }
  }

  closeModal() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.activeModal.close();
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.isFileLocked === false) {
      this.removeFileAccess();
    }
  }
}
