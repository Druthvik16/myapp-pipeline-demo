import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { skip, Subscription } from 'rxjs';
import { pageSelection } from 'src/app/core/models/models';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import { PaginationService, tablePageSize } from 'src/app/shared/shared.index';
import { DiscountBucketPreviewComponent } from '../discount-bucket-preview/discount-bucket-preview.component';
import {
  BsDaterangepickerConfig,
} from 'ngx-bootstrap/datepicker';
import { DiscountService } from 'src/app/core/service/discount/discount.service';

@Component({
  selector: 'app-discount-bucket',
  standalone: false,
  templateUrl: './discount-bucket.component.html',
  styleUrl: './discount-bucket.component.scss',
})
export class DiscountBucketComponent {
  public tableData: Array<any> = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<any>;
  private filteredDiscountBucketData: Array<any> = [];
  private allDiscountBucketData: Array<any> = [];
  clientUuid: string = '';
  private clientSub!: Subscription;
  loadingDiscountBucketFiles: boolean = false;
  public currentSkip = 0;
  public currentLimit = this.pageSize;
  @ViewChild('discountBucketLogsModal') discountBucketLogsModal: any;
  discountBucketLogs: any = [];
  loadingDiscountBucketLogs: boolean = false;
  discountBucketLogFileName: string = '';
  searchText: string = '';
  @ViewChild('dateFilterModal') dateFilterModal: any;
  Math = Math; // Add Math for template usage

  filter: {
    createdOnRange: Date[] | null;
  } = {
      createdOnRange: null,
    };

    
  applyDateFilterClicked: boolean = false;

  bsDateConfig: Partial<BsDaterangepickerConfig> = {
    dateInputFormat: 'DD-MM-YYYY',
    containerClass: 'theme-default',
    showWeekNumbers: false,
    adaptivePosition: true,
    rangeInputFormat: 'DD-MM-YYYY',
  };
  isDateFilterActive = false;
  filteredByDateData: any[] = [];
  tempCreatedOnDate: Date | null = null;
  tempCreatedOnTime: Date | null = null;
  tempCreatedOnRange: Date[] | null = null;

  constructor(
    private modalService: NgbModal,
    private pagination: PaginationService,
    private commonSharedService: CommonSharedService,
    private discountService: DiscountService
  ) { }

  ngOnInit() {
    const storedClient = this.commonSharedService.selectedClientUUID.value;
    const hasValidStoredClient = storedClient?.result && storedClient.uuid;
    if (hasValidStoredClient) {
      this.clientUuid = storedClient.uuid;
      this.getDiscountBucketFiles(this.clientUuid);
    }
    this.clientSub = this.commonSharedService.selectedClientUUID
      .pipe(skip(hasValidStoredClient ? 1 : 0))
      .subscribe((res) => {
        if (res?.result) {
          if (res.uuid) {
            this.clientUuid = res.uuid;
            this.getDiscountBucketFiles(this.clientUuid);
          } else {
            this.clientUuid = res.uuid;
            this.getDiscountBucketFiles(this.clientUuid);
          }
        }
      });
    this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
      this.pageSize = res.pageSize;
      this.currentSkip = res.skip;
      this.currentLimit = res.limit;
      this.getTableData({ skip: res.skip, limit: res.limit });
    });
  }

  async getDiscountBucketFiles(clientUuid: any) {
    try {
      this.loadingDiscountBucketFiles = true;
      let response: any = await this.discountService
        .getDiscounts(clientUuid)
        .toPromise();
      console.log(response);
      if (response) {
        this.allDiscountBucketData = response.sort(
          (a: any, b: any) =>
            new Date(b.created_on).getTime() - new Date(a.created_on).getTime()
        );
        this.filteredDiscountBucketData = [...this.allDiscountBucketData];
        this.totalData = this.filteredDiscountBucketData.length;
        this.getTableData({ skip: 0, limit: this.pageSize });
      }
    } catch (error) {
      console.error('Error fetching discount bucket files:', error);
      this.allDiscountBucketData = [];
      this.filteredDiscountBucketData = [];
      this.totalData = 0;
    } finally {
      this.loadingDiscountBucketFiles = false;
    }
  }

  private getTableData(pageOption: pageSelection): void {
    this.tableData = [];
    this.serialNumberArray = [];
    const slicedData = this.filteredDiscountBucketData.slice(
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

  openDiscountBucketPreview(originalId: any, batchName: any, batchId: any) {
    const dialogRef = this.modalService.open(DiscountBucketPreviewComponent, {
      backdrop: 'static',
      modalDialogClass: 'modal-fullscreen',
    });
    console.log(originalId, batchName, this.clientUuid);
    dialogRef.componentInstance.modalParams = {
      batchId: originalId,
      batchName: batchName,
      clientId: this.clientUuid,
      batchid: batchId
    };
    dialogRef.closed.subscribe((result) => {
      if (result === 'success') {
        this.getDiscountBucketFiles(this.clientUuid).then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
      }
    });
  }

  async getDiscountBucketLogs(batchId: any) {
    try {
      this.loadingDiscountBucketLogs = true;
      let response: any = await this.discountService
        .getDiscountBatchLogs(batchId)
        .toPromise();
      if (response) {
        this.discountBucketLogs = response.sort((a: any, b: any) => {
          return (
            new Date(b.created_on).getTime() - new Date(a.created_on).getTime()
          );
        });
      }
    } catch (error) {
      this.discountBucketLogs = [];
    } finally {
      this.loadingDiscountBucketLogs = false;
    }
  }

  async viewDiscountBucketLogs(batchId: any, batchName: any) {
    this.discountBucketLogFileName = batchName;
    this.getDiscountBucketLogs(batchId);
    this.modalService.open(this.discountBucketLogsModal, {
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
    this.tempCreatedOnRange = this.filter.createdOnRange;
    this.modalService.open(this.dateFilterModal, {
      backdrop: 'static',
      size: 'md',
      windowClass: 'date-filter-modal',
    });
  }

  resetDateFilter() {
    this.filter.createdOnRange = null;
    this.isDateFilterActive = false;
    this.applyAllFilters();
  }

  applyDateFilter(modal: any) {
    this.applyDateFilterClicked = true;
    this.filter.createdOnRange = this.tempCreatedOnRange;
    this.isDateFilterActive = !!this.filter.createdOnRange;
    this.applyAllFilters();
    this.goToFirstPage();
    this.applyDateFilterClicked = false;
    modal.close();
  }

  private isSameDateTimeFlexible(fileDateStr: string, selected: Date): boolean {
    const fileDate = new Date(fileDateStr);
    const today = new Date();
    const selectedHasDate =
      selected.getFullYear() !== today.getFullYear() ||
      selected.getMonth() !== today.getMonth() ||
      selected.getDate() !== today.getDate();
    const selectedHasTime =
      selected.getHours() !== 0 || selected.getMinutes() !== 0;
    if (selectedHasDate && !selectedHasTime) {
      return fileDate.toDateString() === selected.toDateString();
    }
    if (!selectedHasDate && selectedHasTime) {
      const fileHour = fileDate.getHours();
      const selectedHour = selected.getHours();
      const selectedMinute = selected.getMinutes();
      if (selectedMinute === 0) {
        return fileHour === selectedHour;
      }
      return (
        fileHour === selectedHour && fileDate.getMinutes() === selectedMinute
      );
    }
    if (selectedHasDate && selectedHasTime) {
      const dateMatch = fileDate.toDateString() === selected.toDateString();
      const fileHour = fileDate.getHours();
      const selectedHour = selected.getHours();
      const selectedMinute = selected.getMinutes();
      if (selectedMinute === 0) {
        return dateMatch && fileHour === selectedHour;
      }
      return (
        dateMatch &&
        fileHour === selectedHour &&
        fileDate.getMinutes() === selectedMinute
      );
    }
    return true;
  }

  combineDateTime(date: Date | null, time: Date | null): Date | null {
    if (!date && !time) return null;
    const result = new Date();
    if (date) {
      result.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    } else {
      const now = new Date();
      result.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    }

    if (time) {
      result.setHours(time.getHours(), time.getMinutes(), 0, 0);
    } else {
      result.setHours(0, 0, 0, 0);
    }
    return result;
  }

  clearAllFilters() {
    this.searchText = '';
    this.getDiscountBucketFiles(this.clientUuid).then(() => {
      this.pagination.changePagesize.next({
        pageSize: this.pageSize,
      });
    });
    this.resetDateFilter();
  }

  applyAllFilters() {
    const [from, to] = this.filter.createdOnRange || [];
    const searchValue = this.searchText.trim().toLowerCase();
    this.filteredDiscountBucketData = this.allDiscountBucketData.filter(
      (batch: any) => {
        const batchDate = new Date(batch.created_on);
        const matchDate =
          (!from || batchDate >= new Date(from.setHours(0, 0, 0, 0))) &&
          (!to || batchDate <= new Date(to.setHours(23, 59, 59, 999)));
        const matchSearch = searchValue
          ? batch.batch_name.toLowerCase().includes(searchValue) ||
          batch.batch_id.toLowerCase().includes(searchValue)
          : true;

        return matchDate && matchSearch;
      }
    );
    this.totalData = this.filteredDiscountBucketData.length;
    this.getTableData({ skip: 0, limit: this.pageSize });
  }

  resetTempDateFields() {
    this.tempCreatedOnRange = null;
  }

  onTimeChange(type: 'created', value: Date | null) {
    if (type === 'created') {
      this.tempCreatedOnTime = value;
    }
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
