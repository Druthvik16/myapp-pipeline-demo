import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { skip, Subscription } from 'rxjs';
import { pageSelection } from 'src/app/core/models/models';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import { FileService } from 'src/app/core/service/file/file.service';
import { PaginationService, tablePageSize } from 'src/app/shared/shared.index';
import { ApprovedPreviewComponent } from '../approved-preview/approved-preview.component';
import { ProcessService } from 'src/app/core/service/process/process.service';
import {
  BsDaterangepickerConfig,
} from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'app-approved',
  standalone: false,
  templateUrl: './approved.component.html',
  styleUrl: './approved.component.scss',
})
export class ApprovedComponent {
  public tableData: Array<any> = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<any>;
  private filteredApprovedData: Array<any> = [];
  private allApprovedData: Array<any> = [];
  clientUuid: string = '';
  private clientSub!: Subscription;
  loadingApprovedFiles: boolean = false;
  public currentSkip = 0;
  public currentLimit = this.pageSize;
  @ViewChild('approvedLogsModal') approvedLogsModal: any;
  approvedLogs: any = [];
  loadingapprovedLogs: boolean = false;
  approvedLogFileName: string = '';
  searchText: string = '';
  @ViewChild('dateFilterModal') dateFilterModal: any;
  typesList = [
    { id: '', name: 'Select Type' },
    { id: 0, name: 'approved' },
    { id: 1, name: 'reformatted' },
  ];

  
  applyDateFilterClicked: boolean = false;
  filter: {
    uploadedOnRange: Date[] | null;
    updatedOnRange: Date[] | null;
    type: number | '';
  } = {
    uploadedOnRange: null,
    updatedOnRange: null,
    type: '',
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
  tempType: number | '' = '';
  tempUploadedOnRange: Date[] | null = null;
  tempUpdatedOnRange: Date[] | null = null;

  constructor(
    private modalService: NgbModal,
    private fileService: FileService,
    private pagination: PaginationService,
    private commonSharedService: CommonSharedService,
    private processService: ProcessService
  ) {}

  ngOnInit() {
    const storedClient = this.commonSharedService.selectedClientUUID.value;
    if (storedClient?.result && storedClient.uuid) {
      this.clientUuid = storedClient.uuid;
      this.getApprovedFiles(this.clientUuid);
    } else {
      this.getApprovedFiles(this.clientUuid);
    }
    this.clientSub = this.commonSharedService.selectedClientUUID
      .pipe(skip(1))
      .subscribe((res) => {
        if (res?.result) {
          this.clientUuid = res.uuid;
          this.getApprovedFiles(this.clientUuid);
        }
      });
    this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
      this.pageSize = res.pageSize;
      this.currentSkip = res.skip;
      this.currentLimit = res.limit;
      this.getTableData({ skip: res.skip, limit: res.limit });
    });
  }

  async getApprovedFiles(clientUuid: any) {
    try {
      this.loadingApprovedFiles = true;
      let response = await this.fileService.getFiles(clientUuid).toPromise();
      if (response) {
        this.allApprovedData = response
          .filter(
            (file: any) =>
              file.state === 'approved' || file.state === 'reformatted'
          )
          .sort(
            (a: any, b: any) =>
              new Date(b.last_updated_on).getTime() -
              new Date(a.last_updated_on).getTime()
          );
        this.filteredApprovedData = [...this.allApprovedData];
        this.totalData = this.filteredApprovedData.length;
        this.getTableData({ skip: 0, limit: this.pageSize });
      }
    } catch (error) {
      this.allApprovedData = [];
      this.filteredApprovedData = [];
      this.totalData = 0;
    } finally {
      this.loadingApprovedFiles = false;
    }
  }

  private getTableData(pageOption: pageSelection): void {
    this.tableData = [];
    this.serialNumberArray = [];
    const slicedData = this.filteredApprovedData.slice(
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

  openApprovedPreviewScan(fileid: any, fileName: any) {
    const dialogRef = this.modalService.open(ApprovedPreviewComponent, {
      backdrop: 'static',
      modalDialogClass: 'modal-fullscreen',
    });
    dialogRef.componentInstance.modalParams = {
      fileId: fileid,
      fileName: fileName,
    };
    dialogRef.closed.subscribe((result) => {
      if (result === 'success' || result === 'forceReload') {
        this.getApprovedFiles(this.clientUuid).then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
      } else if (result === 'step4-failed') {
        this.getApprovedFiles(this.clientUuid).then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
      }
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

  async getApprovedLogs(fileId: any) {
    try {
      this.loadingapprovedLogs = true;
      let response = await this.processService.getFileLogs(fileId).toPromise();
      if (response) {
        this.approvedLogs = response.sort((a: any, b: any) => {
          return (
            new Date(b.created_on).getTime() - new Date(a.created_on).getTime()
          );
        });
      }
    } catch (error) {
      this.approvedLogs = [];
    } finally {
      this.loadingapprovedLogs = false;
    }
  }

  async viewApprovedLogs(fileId: any, fileName: any) {
    this.approvedLogFileName = fileName;
    this.getApprovedLogs(fileId);
    this.modalService.open(this.approvedLogsModal, {
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
    this.tempUploadedOnRange = this.filter.uploadedOnRange;
    this.tempUpdatedOnRange = this.filter.updatedOnRange;
    this.tempType = this.filter.type;
    this.modalService.open(this.dateFilterModal, {
      backdrop: 'static',
      size: 'md',
      windowClass: 'date-filter-modal',
    });
  }

  resetDateFilter() {
    this.tempUploadedOnRange = null;
    this.tempUpdatedOnRange = null;
    this.filter.uploadedOnRange = null;
    this.filter.updatedOnRange = null;
    this.filter.type = '';
    this.tempType = '';
    this.isDateFilterActive = false;
    this.applyAllFilters();
  }

  applyDateFilter(modal: any) {
    this.applyDateFilterClicked = true;
    this.filter.uploadedOnRange = this.tempUploadedOnRange;
    this.filter.updatedOnRange = this.tempUpdatedOnRange;
    this.filter.type = this.tempType;
    this.isDateFilterActive =
      !!this.filter.uploadedOnRange ||
      !!this.filter.updatedOnRange ||
      this.filter.type !== '';
    this.applyAllFilters();
    this.goToFirstPage();
    this.applyDateFilterClicked = false;
    modal.close();
  }

  clearAllFilters() {
    this.searchText = '';
    this.getApprovedFiles(this.clientUuid).then(() => {
      this.pagination.changePagesize.next({
        pageSize: this.pageSize,
      });
    });
    this.resetDateFilter();
  }

  applyAllFilters() {
    const uploadedRange = this.filter.uploadedOnRange;
    const updatedRange = this.filter.updatedOnRange;
    const selectedType = this.filter.type;
    const searchValue = this.searchText.trim().toLowerCase();
    this.filteredApprovedData = this.allApprovedData.filter((file: any) => {
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
      const matchType =
        selectedType !== ''
          ? file.state ===
            this.typesList.find(
              (t) => t.id.toString() === selectedType.toString()
            )?.name
          : true;
      return matchUploaded && matchUpdated && matchSearch && matchType;
    });
    this.totalData = this.filteredApprovedData.length;
    this.getTableData({ skip: 0, limit: this.pageSize });
  }

  private isDateInRange(fileDate: Date, start: Date, end: Date): boolean {
    const file = new Date(fileDate.setHours(0, 0, 0, 0));
    const from = new Date(start.setHours(0, 0, 0, 0));
    const to = new Date(end.setHours(0, 0, 0, 0));
    return file >= from && file <= to;
  }

  get selectedTypeName(): string {
    return this.typesList.find((t) => t.id === this.filter.type)?.name || '';
  }

  resetTempDateFields() {
    this.tempUploadedOnRange = null;
    this.tempUpdatedOnRange = null;
    this.tempType = '';
  }

  public goToFirstPage(): void {
    this.pagination.changePagesize.next({
      pageSize: this.pageSize,
    });
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  ngOnDestroy() {
    this.clientSub?.unsubscribe();
  }
}
