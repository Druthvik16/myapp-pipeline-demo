import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { routes } from 'src/app/core/helpers/routes';
import { pageSelection } from 'src/app/core/models/models';
import { FileService } from 'src/app/core/service/file/file.service';
import { PaginationService, tablePageSize } from 'src/app/shared/shared.index';
import { HeaderMappingComponent } from '../header-mapping/header-mapping.component';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import { skip, Subscription } from 'rxjs';
import { ProcessService } from 'src/app/core/service/process/process.service';
import { BsDaterangepickerConfig } from 'ngx-bootstrap/datepicker';
import { CustomPaginationComponent } from 'src/app/shared/custom-pagination/custom-pagination.component';
import { DateRangeFilterComponent } from 'src/app/shared/date-range-filter/date-range-filter.component';

@Component({
  selector: 'app-formatted',
  standalone: false,
  templateUrl: './formatted.component.html',
  styleUrl: './formatted.component.scss',
})
export class FormattedComponent {
  public routes = routes;
  public tableData: Array<any> = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<any>;
  private filteredFormattedFilesData: Array<any> = [];
  private allFormatedFilesData: Array<any> = [];
  clientUuid: string = '';
  private clientSub!: Subscription;
  loadingFormattedFiles: boolean = false;
  public currentSkip = 0;
  public currentLimit = this.pageSize;
  searchText: string = '';
  @ViewChild('formattedLogsModal') formattedLogsModal: any;
  formattedLogs: any = [];
  loadingformattedLogs: boolean = false;
  formattedLogFileName: string = '';
  @ViewChild('dateFilterModal') dateFilterModal: any;
  @ViewChild(CustomPaginationComponent)
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
      this.getFormattedFiles(this.clientUuid);
    } else {
      this.getFormattedFiles(this.clientUuid);
    }
    this.clientSub = this.commonSharedService.selectedClientUUID
      .pipe(skip(1))
      .subscribe((res) => {
        if (res?.result) {
          this.clientUuid = res.uuid;
          this.getFormattedFiles(this.clientUuid);
        }
      });
    this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
      this.pageSize = res.pageSize;
      this.currentSkip = res.skip;
      this.currentLimit = res.limit;
      this.getTableData({ skip: res.skip, limit: res.limit });
    });
  }

  async getFormattedFiles(clientUuid: any) {
    try {
      this.loadingFormattedFiles = true;
      let response = await this.fileService.getFiles(clientUuid).toPromise();
      if (response) {
        this.allFormatedFilesData = response
          .filter((file: any) => file.state === 'formatted')
          .sort(
            (a: any, b: any) =>
              new Date(b.last_updated_on).getTime() -
              new Date(a.last_updated_on).getTime()
          );
        this.filteredFormattedFilesData = [...this.allFormatedFilesData];
        this.totalData = this.filteredFormattedFilesData.length;
        this.getTableData({ skip: 0, limit: this.pageSize });
      }
    } catch (error) {
      this.allFormatedFilesData = [];
      this.filteredFormattedFilesData = [];
      this.totalData = 0;
    } finally {
      this.loadingFormattedFiles = false;
    }
  }

  private getTableData(pageOption: pageSelection): void {
    this.tableData = [];
    this.serialNumberArray = [];
    const slicedData = this.filteredFormattedFilesData.slice(
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

  openHeaderMappingModal(fileid: any, fileName: any) {
    const dialogRef = this.modalService.open(HeaderMappingComponent, {
      backdrop: 'static',
      size: 'md',
    });
    dialogRef.componentInstance.modalParams = {
      fileId: fileid,
      fileName: fileName,
    };
    dialogRef.result.then((result) => {
      if (result === 'success' || result === 'forceReload') {
        this.getFormattedFiles(this.clientUuid).then(() => {
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

  async getFormattedLogs(fileId: any) {
    try {
      this.loadingformattedLogs = true;
      let response = await this.processService.getFileLogs(fileId).toPromise();
      if (response) {
        this.formattedLogs = response.sort((a: any, b: any) => {
          return (
            new Date(b.created_on).getTime() - new Date(a.created_on).getTime()
          );
        });
      }
    } catch (error) {
      this.formattedLogs = [];
    } finally {
      this.loadingformattedLogs = false;
    }
  }

  async viewFormattedLogs(fileId: any, fileName: any) {
    this.formattedLogFileName = fileName;
    await this.getFormattedLogs(fileId);
    this.modalService.open(this.formattedLogsModal, {
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

  clearAllFilters() {
    this.searchText = '';
    this.getFormattedFiles(this.clientUuid).then(() => {
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
    this.filteredFormattedFilesData = this.allFormatedFilesData.filter(
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
    this.totalData = this.filteredFormattedFilesData.length;
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
}
