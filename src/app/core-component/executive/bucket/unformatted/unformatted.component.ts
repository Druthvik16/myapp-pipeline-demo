import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { routes } from 'src/app/core/helpers/routes';
import { DataFormatterComponent } from '../data-formatter/data-formatter.component';
import { MatTableDataSource } from '@angular/material/table';
import { FileService } from 'src/app/core/service/file/file.service';
import { pageSelection } from 'src/app/core/models/models';
import {
  PaginationService,
  tablePageSize,
} from 'src/app/shared/custom-pagination/pagination.service';
import { ActivatedRoute } from '@angular/router';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import { skip, Subscription } from 'rxjs';
import { BsDaterangepickerConfig } from 'ngx-bootstrap/datepicker';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-unformatted',
  standalone: false,
  templateUrl: './unformatted.component.html',
  styleUrl: './unformatted.component.scss',
})
export class UnformattedComponent {
  public routes = routes;
  public tableData: Array<any> = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<any>;
  private filteredFilesData: Array<any> = [];
  private allFilesData: Array<any> = [];
  clientUuid: string = '';
  private clientSub!: Subscription;
  private hasInitialLoaded = false;
  loadingUnformattedFiles: boolean = false;
  public currentSkip = 0;
  public currentLimit = this.pageSize;
  isDateFilterActive = false;
  datePart: Date | null = null;
  timePart: Date | null = null;
  showPicker: boolean = false;
  bsDateConfig: Partial<BsDaterangepickerConfig> = {
    dateInputFormat: 'DD/MM/YYYY',
    containerClass: 'theme-default',
    rangeInputFormat: 'DD/MM/YYYY',
    showWeekNumbers: false,
    adaptivePosition: false,
  };
  searchText: string = '';
  filteredDate: Date | null = null;
  filter = {
    uploadedOnRange: [] as Date[] | null,
  };
  tempUploadedOnRange: Date[] | null = null;
   userData: any;

  constructor(
    private modalService: NgbModal,
    private fileService: FileService,
    private pagination: PaginationService,
    private route: ActivatedRoute,
    private commonSharedService: CommonSharedService
  ) {}

  ngOnInit() {
    this.userData = JSON.parse(sessionStorage.getItem('LOGINUSER') || '{}');
    this.route.queryParams.subscribe((params) => {
      if (this.hasInitialLoaded) return;
      const queryUUID = params['client_uuid'];
      if (queryUUID) {
        this.clientUuid = queryUUID;
        this.getUnformattedFiles(this.clientUuid);
        this.hasInitialLoaded = true;
      } else {
        const storedClient = this.commonSharedService.selectedClientUUID.value;
        if (storedClient?.result && storedClient.uuid) {
          this.clientUuid = storedClient.uuid;
          this.getUnformattedFiles(this.clientUuid);
          this.hasInitialLoaded = true;
        } else {
          this.getUnformattedFiles(this.clientUuid);
          this.hasInitialLoaded = true;
        }
      }
    });

    this.clientSub = this.commonSharedService.selectedClientUUID
      .pipe(skip(1))
      .subscribe((res) => {
        if (res?.result) {
          this.clientUuid = res.uuid;
          this.getUnformattedFiles(this.clientUuid);
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
    
  async getUnformattedFiles(clientUuid: any) {
    try {
      this.loadingUnformattedFiles = true;
      let response = await this.fileService.getFiles(clientUuid).toPromise();
      if (response) {
        this.allFilesData = response
          .filter((file: any) => file.state === 'unformatted')
          .sort(
            (a: any, b: any) =>
              new Date(b.last_updated_on).getTime() -
              new Date(a.last_updated_on).getTime()
          );
        this.filteredFilesData = [...this.allFilesData];
        this.totalData = this.filteredFilesData.length;
        this.getTableData({ skip: 0, limit: this.pageSize });
      }
    } catch (error) {
      this.allFilesData = [];
      this.filteredFilesData = [];
      this.totalData = 0;
    } finally {
      this.loadingUnformattedFiles = false;
    }
  }

  private getTableData(pageOption: pageSelection): void {
    this.tableData = [];
    this.serialNumberArray = [];
    const slicedData = this.filteredFilesData.slice(
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

  async openDataFormatterModal(file: any, fileName: any) {
    const dialogRef = this.modalService.open(DataFormatterComponent, {
      backdrop: 'static',
      modalDialogClass: 'modal-fullscreen',
    });
    dialogRef.componentInstance.modalParams = {
      file: file,
      fileName: fileName,
      clientUUID: this.clientUuid
    };
    dialogRef.result.then((result) => {
      if (result === 'success' || result === 'forceReload') {
        this.getUnformattedFiles(this.clientUuid).then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
      }
    });
  }

  public searchData(value: string): void {
    const trimmedValue = value.trim();
    this.searchText = trimmedValue;
    this.applyFilters();
    this.goToFirstPage();
  }

  applyFilters() {
    const uploadedRange = this.filter.uploadedOnRange;
    const searchValue = this.searchText.trim().toLowerCase();
    this.filteredFilesData = this.allFilesData.filter((file: any) => {
      const uploadedDate = new Date(file.uploaded_on);
      uploadedDate.setHours(0, 0, 0, 0);
      const matchesDate =
        uploadedRange?.length === 2
          ? this.isDateInRange(uploadedDate, uploadedRange[0], uploadedRange[1])
          : true;

      const matchesSearch = searchValue
        ? file.original_file_name?.toLowerCase().includes(searchValue)
        : true;
      return matchesDate && matchesSearch;
    });
    this.totalData = this.filteredFilesData.length;
    this.getTableData({ skip: 0, limit: this.pageSize });
  }

  isDateInRange(date: Date, start: Date, end: Date): boolean {
    const d = new Date(date).setHours(0, 0, 0, 0);
    const s = new Date(start).setHours(0, 0, 0, 0);
    const e = new Date(end).setHours(0, 0, 0, 0);
    return d >= s && d <= e;
  }

  clearAllFilters(): void {
    this.searchText = '';
    this.tempUploadedOnRange = null;
    this.filter.uploadedOnRange = null;
    this.isDateFilterActive = false;
    this.getUnformattedFiles(this.clientUuid).then(() => {
      this.pagination.changePagesize.next({
        pageSize: this.pageSize,
      });
    });
  }

  isWithinDateRange(date: Date, range: Date[]): boolean {
    const start = new Date(range[0]);
    const end = new Date(range[1]);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }

  onDateRangeChange(range: Date[] | null): void {
    this.filter.uploadedOnRange = range;
    this.isDateFilterActive = !!range?.length;
    this.applyFilters();
    this.goToFirstPage();
  }

  clearDateFilter(): void {
    this.tempUploadedOnRange = null;
    this.filter.uploadedOnRange = null;
    this.isDateFilterActive = false;
    this.applyFilters();
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
