import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { skip, Subscription } from 'rxjs';
import { routes } from 'src/app/core/helpers/routes';
import { pageSelection } from 'src/app/core/models/models';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import { FileService } from 'src/app/core/service/file/file.service';
import { PaginationService, tablePageSize } from 'src/app/shared/shared.index';
import { UploadedPreviewComponent } from '../uploaded-preview/uploaded-preview.component';
import { ProcessService } from 'src/app/core/service/process/process.service';
import { BsDaterangepickerConfig } from 'ngx-bootstrap/datepicker';
import { DateRangeFilterComponent } from 'src/app/shared/date-range-filter/date-range-filter.component';
import Swal from 'sweetalert2';
import { ListService } from 'src/app/core/service/list/list.service';

@Component({
  selector: 'app-uploaded',
  standalone: false,
  templateUrl: './uploaded.component.html',
  styleUrl: './uploaded.component.scss',
})
export class UploadedComponent {
  public routes = routes;
  public tableData: Array<any> = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<any>;
  private filteredUploadedFilesData: Array<any> = [];
  private allUploadedData: Array<any> = [];
  clientUuid: string = '';
  private clientSub!: Subscription;
  loadingUploadedFiles: boolean = false;
  public currentSkip = 0;
  public currentLimit = this.pageSize;
  @ViewChild('uploadedLogsModal') uploadedLogsModal: any;
  uploadedLogs: any = [];
  loadinguploadedLogs: boolean = false;
  uploadedLogFileName: string = '';
  searchText: string = '';
  filter: {
    uploadedOnRange: Date[] | null;
    updatedOnRange: Date[] | null;
  } = {
    uploadedOnRange: null,
    updatedOnRange: null,
  };
  bsDateConfig: Partial<BsDaterangepickerConfig> = {
    dateInputFormat: 'DD/MM/YYYY',
    containerClass: 'theme-default',
    rangeInputFormat: 'DD/MM/YYYY',
    showWeekNumbers: false,
    adaptivePosition: false,
  };
  isDateFilterActive = false;
  filteredByDateData: any[] = [];
  userData: any;
  @ViewChild('deleteConfirmModal') deleteConfirmModal: any;
  deleteRemark: string = '';
  deleteConfirmationText: string = '';

  constructor(
    private modalService: NgbModal,
    private fileService: FileService,
    private pagination: PaginationService,
    private commonSharedService: CommonSharedService,
    private processService: ProcessService,
    private listService: ListService
  ) {}

  ngOnInit() {
    this.userData = JSON.parse(sessionStorage.getItem('LOGINUSER') || '{}');
    const storedClient = this.commonSharedService.selectedClientUUID.value;
    if (storedClient?.result && storedClient.uuid) {
      this.clientUuid = storedClient.uuid;
      this.getUploadedFiles(this.clientUuid);
    } else {
      this.getUploadedFiles(this.clientUuid);
    }

    this.clientSub = this.commonSharedService.selectedClientUUID
      .pipe(skip(1))
      .subscribe((res) => {
        if (res?.result) {
          this.clientUuid = res.uuid;
          this.getUploadedFiles(this.clientUuid);
        }
      });
    this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
      this.pageSize = res.pageSize;
      this.currentSkip = res.skip;
      this.currentLimit = res.limit;
      this.getTableData({ skip: res.skip, limit: res.limit });
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

  async getUploadedFiles(clientUuid: any) {
    try {
      this.loadingUploadedFiles = true;
      let response = await this.fileService.getFiles(clientUuid).toPromise();
      if (response) {
        this.allUploadedData = response
          .filter((file: any) => file.state === 'uploaded')
          .sort(
            (a: any, b: any) =>
              new Date(b.last_updated_on).getTime() -
              new Date(a.last_updated_on).getTime()
          );
        this.filteredUploadedFilesData = [...this.allUploadedData];
        this.totalData = this.filteredUploadedFilesData.length;
        this.getTableData({ skip: 0, limit: this.pageSize });
      }
    } catch (error) {
      this.allUploadedData = [];
      this.filteredUploadedFilesData = [];
      this.totalData = 0;
    } finally {
      this.loadingUploadedFiles = false;
    }
  }

  private getTableData(pageOption: pageSelection): void {
    this.tableData = [];
    this.serialNumberArray = [];
    const slicedData = this.filteredUploadedFilesData.slice(
      pageOption.skip,
      pageOption.limit
    );
    slicedData.forEach((res: any, index: number) => {
      res.sNo = pageOption.skip + index + 1;
      this.tableData.push(res);
      this.serialNumberArray.push(res.sNo);
    });
    this.dataSource = new MatTableDataSource<any>(this.tableData);
    this.pagination.calculatePageSize.next({
      totalData: this.totalData,
      pageSize: this.pageSize,
      tableData: this.tableData,
      serialNumberArray: this.serialNumberArray,
    });
  }

  async downloadFile(id: any, fileName: any) {
    try {
      let response = await this.fileService.fileDownload(id).toPromise();
      if (response) {
        this.commonSharedService.downloadBlobFile(response, fileName);
      }
    } catch (error) {}
  }

  openUploadedPreviewModal(fileid: any, fileName: any) {
    const dialogRef = this.modalService.open(UploadedPreviewComponent, {
      backdrop: 'static',
      modalDialogClass: 'modal-fullscreen',
    });
    dialogRef.componentInstance.modalParams = {
      fileId: fileid,
      fileName: fileName,
    };
    dialogRef.result.then((result) => {
      if (result === 'success') {
        this.getUploadedFiles(this.clientUuid).then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
      }
    });
  }

  async getUploadedLogs(fileId: any) {
    try {
      this.loadinguploadedLogs = true;
      let response = await this.processService.getFileLogs(fileId).toPromise();
      if (response) {
        this.uploadedLogs = response.sort((a: any, b: any) => {
          return (
            new Date(b.created_on).getTime() - new Date(a.created_on).getTime()
          );
        });
      }
    } catch (error) {
      this.uploadedLogs = [];
    } finally {
      this.loadinguploadedLogs = false;
    }
  }

  async viewUploadedLogs(fileId: any, fileName: any) {
    this.uploadedLogFileName = fileName;
    await this.getUploadedLogs(fileId);
    this.modalService.open(this.uploadedLogsModal, {
      size: 'lg',
      backdrop: 'static',
    });
  }

  public searchData(value: string): void {
    const trimmedValue = value.trim();
    this.searchText = trimmedValue;
    this.applyAllFilters();
    this.goToFirstPage();
  }

  openDateFilterModal() {
    const modalRef = this.modalService.open(DateRangeFilterComponent, {
      backdrop: 'static',
      scrollable: true,
      size: 'md',
      windowClass: 'date-filter-modal',
    });
    modalRef.componentInstance.uploadedOnRange = this.filter.uploadedOnRange;
    modalRef.componentInstance.updatedOnRange = this.filter.updatedOnRange;
    modalRef.componentInstance.apply.subscribe((selectedRanges: any) => {
      this.filter.uploadedOnRange = selectedRanges.uploadedOn;
      this.filter.updatedOnRange = selectedRanges.updatedOn;
      this.isDateFilterActive = !!(
        this.filter.uploadedOnRange || this.filter.updatedOnRange
      );
      this.applyAllFilters();
      this.goToFirstPage();
    });
  }

  resetDateFilter() {
    this.filter.uploadedOnRange = null;
    this.filter.updatedOnRange = null;
    this.isDateFilterActive = false;
    this.applyAllFilters();
  }

  applyDateFilter(modal: any) {
    this.isDateFilterActive = !!(
      this.filter.uploadedOnRange || this.filter.updatedOnRange
    );
    this.applyAllFilters();
    this.goToFirstPage();
    modal.close();
  }

  clearAllFilters() {
    this.searchText = '';
    this.getUploadedFiles(this.clientUuid).then(() => {
      this.pagination.changePagesize.next({
        pageSize: this.pageSize,
      });
    });
    this.resetDateFilter();
  }

  applyAllFilters() {
    const uploadedRange = this.filter.uploadedOnRange;
    const updatedRange = this.filter.updatedOnRange;
    const searchValue = this.searchText.trim().toLowerCase();
    this.filteredUploadedFilesData = this.allUploadedData.filter(
      (file: any) => {
        const fileUploadedDate = new Date(file.uploaded_on);
        const fileUpdatedDate = new Date(file.last_updated_on);
        const matchUploaded =
          uploadedRange && uploadedRange.length === 2
            ? this.isDateInRange(
                fileUploadedDate,
                uploadedRange[0],
                uploadedRange[1]
              )
            : true;
        const matchUpdated =
          updatedRange && updatedRange.length === 2
            ? this.isDateInRange(
                fileUpdatedDate,
                updatedRange[0],
                updatedRange[1]
              )
            : true;
        const matchSearch = searchValue
          ? file.original_file_name.toLowerCase().includes(searchValue)
          : true;
        return matchUploaded && matchUpdated && matchSearch;
      }
    );
    this.totalData = this.filteredUploadedFilesData.length;
    this.getTableData({ skip: 0, limit: this.pageSize });
  }

  private isDateInRange(fileDate: Date, start: Date, end: Date): boolean {
    const file = new Date(fileDate.setHours(0, 0, 0, 0));
    const from = new Date(start.setHours(0, 0, 0, 0));
    const to = new Date(end.setHours(0, 0, 0, 0));
    return file >= from && file <= to;
  }

  public goToFirstPage(): void {
    this.pagination.changePagesize.next({
      pageSize: this.pageSize,
    });
  }

  ngOnDestroy() {
    this.clientSub?.unsubscribe();
  }

  deleteFile(id: any) {
    if (id != '') {
      Swal.fire({
        title: 'Confirmation',
        text: 'You want to delete File?',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#364574',
        cancelButtonColor: 'rgb(243, 78, 78)',
        confirmButtonText: 'Delete',
      }).then(async (result) => {
        if (result.value) {
          this.openDeleteConfirmationModal(id);
        }
      });
    } else {
      this.showNotification('Error', 'File not deleted', 'error');
    }
  }

  async openDeleteConfirmationModal(fileId: any) {
    this.deleteRemark = '';
    this.deleteConfirmationText = '';
    const modalRef = this.modalService.open(this.deleteConfirmModal, {
      backdrop: 'static',
      size: 'md',
      centered: true,
    });
    try {
      const result = await modalRef.result;
      if (result === 'confirmed') {
        this.performFileDeletion(fileId);
      }
    } catch (error: any) {
      if (error !== 'user-cancelled') {
        console.error('Modal error:', error);
      }
    }
  }

  submitDeletion(modal: any) {
    if (!this.deleteRemark.trim()) {
      this.showNotification('Warning', 'Please enter a remark.', 'warning');
      return;
    }
    if (this.deleteConfirmationText.trim() !== 'confirm') {
      this.showNotification(
        'Warning',
        'Please type "confirm" to Proceed deletion.',
        'warning'
      );
      return;
    }

    modal.close('confirmed');
  }

  async performFileDeletion(id: any) {
    try {
      this.showNotification('Processing...', '', 'info');
      let response = await this.listService.deleteUploadedFile(id, this.deleteRemark.trim()).toPromise();

      if (response) {
        this.showNotification('Success', 'File deleted', 'success');
        this.getUploadedFiles(this.clientUuid).then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
      }
    } catch (e) {
      this.showNotification('Error', 'File not deleted', 'error');
    }
  }

  closeDeleteModal(modal: any) {
    modal.dismiss('user-cancelled');
  }
}
