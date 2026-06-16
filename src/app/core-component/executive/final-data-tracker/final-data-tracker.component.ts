import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { routes } from 'src/app/core/helpers/routes';
import { TrackerService } from 'src/app/core/service/tracker/tracker.service';
import { ClientService } from 'src/app/core/service/client/client.service';
import { formatDate } from '@angular/common';
import {
  BsDaterangepickerConfig,
} from 'ngx-bootstrap/datepicker';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import { skip, Subscription } from 'rxjs';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { ExcelStyleFilterComponent } from '../excel-style-filter/excel-style-filter.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from 'src/app/core/service/master/master.service';

@Component({
  selector: 'app-final-data-tracker',
  standalone: false,
  templateUrl: './final-data-tracker.component.html',
  styleUrl: './final-data-tracker.component.scss',
})
export class FinalDataTrackerComponent {
  public routes = routes;
  public tableData: Array<any> = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<any>;
  filteredUploadedData: any = [];
  private allUploadedData: any = [];
  public searchDataValue = '';
  clients: any = [];
  clientUuid: string = '';
  private clientSub!: Subscription;
  clientId: any;
  loading: boolean = false;
  downloadExcel: boolean = false;
  @ViewChild('agGrid') agGrid!: AgGridAngular;
  
  applyDateFilterClicked: boolean = false;
  columnDefs: ColDef[] = [
    {
      headerName: '#',
      field: 'rowNum',
      width: 50,
      minWidth: 40,
      maxWidth: 60,
      suppressSizeToFit: true
    },
    {
      headerName: 'Store Code',
      field: 'store_code',
      width: 80,
      minWidth: 80,
      maxWidth: 100
    },
    {
      headerName: 'Customer Name',
      field: 'customer_name',
      width: 140,
      minWidth: 140,
      wrapText: true,
      autoHeight: true,
      cellClass: 'wrap-cell'
    },
    {
      headerName: 'Month',
      field: 'month',
      width: 60,
      minWidth: 60,
      maxWidth: 100
    },
    {
      headerName: 'Year',
      field: 'year',
      width: 50,
      minWidth: 50,
      maxWidth: 70
    },
    {
      headerName: 'Brand Names',
      field: 'brand_names',
      width: 90,
      minWidth: 70,
      maxWidth: 100
    },
    {
      headerName: 'File Name',
      field: 'original_file_name',
      width: 150,
      minWidth: 150,
      wrapText: true,
      autoHeight: true,
      cellClass: 'wrap-cell'
    },
    {
      headerName: 'Status',
      field: 'state_name',
      width: 100,
      minWidth: 100,
      maxWidth: 110
    },
    {
      headerName: 'Created On',
      field: 'created_on',
      width: 100,
      minWidth: 100,
      maxWidth: 110
    },
    {
      headerName: 'Created By',
      field: 'staff_name',
      width: 80,
      minWidth: 80,
      maxWidth: 110
    },
    {
      headerName: 'Batch ID',
      field: 'batch_id',
      width: 190,
      minWidth: 190,
      maxWidth: 220
    },
  ];
  defaultColDef = {
    resizable: true,
    sortable: true,
    filter: ExcelStyleFilterComponent,
    cellClass: 'excel-cell',
    headerClass: 'excel-header',
    autoHeight: true,
    wrapText: true,
    cellStyle: undefined,
  };
  gridOptions: GridOptions = {
    context: {
      componentParent: this,
    },
    onFilterChanged: () => {
      this.anyFilterActive = this.gridApi.isAnyFilterPresent();
    },
    defaultColDef: this.defaultColDef,
    theme: 'legacy',
    suppressCellFocus: true,
    rowHeight: 22,
    headerHeight: 24,
    animateRows: true,
    suppressRowHoverHighlight: true,
    suppressRowClickSelection: true,
    rowClass: 'excel-row',
    suppressHorizontalScroll: false,
    suppressColumnVirtualisation: true,
    rowSelection: 'multiple',
  };
  anyFilterActive: boolean = false;
  gridApi!: GridApi;
  @ViewChild('dateFilterModal') dateFilterModal!: TemplateRef<any>;
  bsDateConfig: Partial<BsDaterangepickerConfig> = {
    dateInputFormat: 'DD/MM/YYYY',
    rangeInputFormat: 'DD/MM/YYYY',
    containerClass: 'theme-default',
    showWeekNumbers: false,
    adaptivePosition: true,
    isAnimated: true,

  };
  filter = {
    year: null as any,
    month: null as any,
    dateRange: null as Date[] | null,
    brand: null as any,
    storeCode: null as any,
    status: null as any,
  };
  tempFilter = {
    year: null as any,
    month: null as any,
    dateRange: null as Date[] | null,
    brand: null as any,
    storeCode: null as any,
    status: null as any,
  };
  years: any = [];
  yearUuid: any
  months: any = []
  monthUuid: any
  dates: any = []
  dateUuid: any
  brands: any = []
  status: any = []
  storeCodes: any = []

  isLoadBrand: boolean = false
  isLoadYear: boolean = false
  isLoadStoreCode: boolean = false
  isLoadStatus: boolean = false

  constructor(
    private clientService: ClientService,
    private trackerService: TrackerService,
    private commonSharedService: CommonSharedService,
    private modalService: NgbModal,
    private masterService: MasterService
  ) { }

  ngOnInit() {
    const storedClient = this.commonSharedService.selectedClientUUID.value;
    const hasValidStoredClient = storedClient?.result && storedClient.uuid;
    if (hasValidStoredClient) {
      this.clientUuid = storedClient.uuid;
      this.handleClientSelection(this.clientUuid);
    }
    this.clientSub = this.commonSharedService.selectedClientUUID
      .pipe(skip(hasValidStoredClient ? 1 : 0))
      .subscribe(async (res) => {
        if (res?.result) {
          if (res.uuid) {
            this.clientUuid = res.uuid || ''
            await this.getClients();
            const matchedClient = this.clients.find(
              (client: any) => client.uuid === this.clientUuid
            );
            if (matchedClient?.id) {
              await this.getFinalDataTracker();
            }
          } else {
            this.clientUuid = res.uuid
            await this.getFinalDataTracker();
          }
        }
      });
  }

  async handleClientSelection(uuid: string) {
    await this.getClients();
    const matchedClient = this.clients.find(
      (client: any) => client.uuid === uuid
    );
    if (matchedClient?.id) {
      this.clientId = matchedClient.id;
      await this.getFinalDataTracker();
    }
  }

  async getClients() {
    try {
      let response = await this.clientService.getClients().toPromise();
      if (response) {
        this.clients = response;
      }
    } catch (error) {
      this.clients = [];
    }
  }

  async getFinalDataTracker() {
    try {
      this.loading = false;
      if (this.gridApi) {
        this.gridApi.setGridOption('loading', true);
      }
      const filter = {
        client_id: this.clientId || '',
        batch_id: null,
      };
      const clientUUId = this.clientUuid
      const status = this.tempFilter.status || 'uploaded'
      const storecode = this.tempFilter.storeCode || ''
      const brand = this.tempFilter.brand || ''
      const month = this.tempFilter.month || ''
      const year = this.tempFilter.year || ''
      const fromDate = this.tempFilter.dateRange?.[0]
        ? formatDate(this.tempFilter.dateRange[0], 'yyyy-MM-dd', 'en-IN')
        : "";
      const toDate = this.tempFilter.dateRange?.[1]
        ? formatDate(this.tempFilter.dateRange[1], 'yyyy-MM-dd', 'en-IN')
        : "";
      const response = await this.trackerService.getFinalDataTrackers(clientUUId, status,
        storecode, brand, month, year, fromDate, toDate
      ).toPromise();
      if (response) {
        this.allUploadedData = response.map((row: any, index: number) => {
          if (row.created_on) {
            const createdDate = new Date(row.created_on);
            if (!isNaN(createdDate.getTime())) {
              row.created_on = formatDate(createdDate, 'dd-MM-yyyy', 'en-IN');
            //   row.created_on = formatDate(createdDate, 'dd-MM-yyyy', 'en-IN', 'UTC');
            }
          }
          if (row.month) {
            row.month = this.getMonthText(row.month);
          }
          row.customer_name = row.customer_name || '';
          row.state_name = row.state_name || '';
          row.batch_id = row.batch_id || '';
          row.rowNum = index + 1;
          return row;
        });
        this.allUploadedData = this.sortAndReindex(response, 'created_on');
        this.filteredUploadedData = [...this.allUploadedData];
      }
    } catch (error) {
      this.allUploadedData = [];
      this.filteredUploadedData = [];
      if (this.gridApi) {
        this.gridApi.setGridOption('loading', false);
      }
    } finally {
      this.loading = false;
      if (this.gridApi) {
        this.gridApi.setGridOption('loading', false);
      }
    }
  }

  exportToExcel(): void {
    this.downloadExcel = true;
    let dataToExport = this.filteredUploadedData;
    if (this.gridApi && this.gridApi.isAnyFilterPresent()) {
      const filteredRows = [];
      const rowCount = this.gridApi.getDisplayedRowCount();
      for (let i = 0; i < rowCount; i++) {
        const rowNode = this.gridApi.getDisplayedRowAtIndex(i);
        if (rowNode && rowNode.data) {
          filteredRows.push(rowNode.data);
        }
      }
      dataToExport = filteredRows;
    }

    const exportData = dataToExport.map(
      (row: any) => ({
        'Store Code': row.store_code,
        'Customer Name': row.customer_name,
        'Brand Names': row.brand_names,
        'File Name': row.original_file_name,
        'Status': row.state_name,
        'Created On': row.created_on,
        'Created By': row.staff_name,
        'Batch ID': row.batch_id,
      })
    );
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Final Data Tracker': worksheet },
      SheetNames: ['Final Data Tracker'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'final-data-tracker.xlsx');
    this.downloadExcel = false;
  }


  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    if (this.loading) {
      this.gridApi.setGridOption('loading', true);
    }
  }


  get isFilterActive(): boolean {
    return !!(
      this.filter.year ||
      this.filter.month ||
      this.filter.dateRange ||
      this.filter.brand ||
      this.filter.storeCode ||
      this.filter.status
    );
  }

  async openDateFilterModal() {
    this.tempFilter = { ...this.filter };
    this.tempFilter.dateRange = this.filter.dateRange;
    if (this.tempFilter.year) {
      await this.getMonths(this.tempFilter.year);
    }
    this.modalService.open(this.dateFilterModal, {
      backdrop: 'static',
      size: 'md',
      windowClass: 'date-filter-modal',
    });
     this.loadFilterDropdowns();
  }

 async resetTempDateFields(modal: any) {
    this.tempFilter = {
      year: null,
      month: null,
      dateRange: null,
      brand: null,
      storeCode: null,
      status: null,
    };
    this.months = [];
    this.brands = [];
    this.storeCodes = [];
    this.status = [];
    this.filter = {
      year: null,
      month: null,
      dateRange: null,
      brand: null,
      storeCode: null,
      status: null,
    };
    await this.getFinalDataTracker()

    modal.close();
    // this.filteredUploadedData = this.allUploadedData;
  }

  get isApplyDisabled(): boolean {
    return !(
      this.tempFilter.year &&
      this.tempFilter.month &&
      this.tempFilter.dateRange &&
      this.tempFilter.brand &&
      this.tempFilter.storeCode &&
      this.tempFilter.status
    );
  }

  async applyDateFilter(modal: any) {
    this.applyDateFilterClicked = true;
    this.filter = { ...this.tempFilter };
    this.filter.dateRange = this.tempFilter.dateRange;
    await this.getFinalDataTracker()
    this.applyDateFilterClicked = false;
    modal.close();
  }

  isInRange(dateStr: string, range: Date[]): boolean {
    if (!dateStr || !range || range.length !== 2) return false;
    const [start, end] = range;
    const date = this.parseDate(dateStr);
    return date >= start && date <= end;
  }

  parseDate(str: string): Date {
    const parts = str.split('-');
    return new Date(+parts[2], +parts[1] - 1, +parts[0]);
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`; // yyyy-dd-mm format
  }

  getYearFromDate(dateStr: string): number {
    const parts = dateStr.split('-');
    return +parts[2];
  }

  getMonthFromDate(dateStr: string): number {
    const parts = dateStr.split('-');
    return +parts[1];
  }

  async clearAllFilters() {
    if (!this.gridApi) return;
    this.gridApi.setFilterModel(null);
    this.gridApi.getColumnDefs()?.forEach((colDef: any) => {
      if (colDef.field && colDef.filter === ExcelStyleFilterComponent) {
        const event = new CustomEvent('filterReset', {
          detail: { columnField: colDef.field },
        });
        window.dispatchEvent(event);
      }
    });
    this.filter = {
      year: null,
      month: null,
      dateRange: null,
      brand: null,
      storeCode: null,
      status: null,
    };

    this.tempFilter = {
      year: null,
      month: null,
      dateRange: null,
      brand: null,
      storeCode: null,
      status: null,
    };
    this.months = [];
    this.brands = [];
    this.storeCodes = [];
    this.status = [];
    await this.getFinalDataTracker()
    this.gridApi.onFilterChanged();
    window.dispatchEvent(new Event('filterChanged'));
    this.anyFilterActive = false;
  }

  isAnyFilterActive(): boolean {
    return !!(
      this.filter.year ||
      this.filter.month ||
      this.filter.dateRange ||
      this.filter.brand ||
      this.filter.storeCode ||
      this.filter.status ||
      this.gridApi?.isAnyFilterPresent?.()
    );
  }

  ngOnDestroy() {
    this.clientSub?.unsubscribe();
  }

  async getYears() {
    try {
      let response = await this.masterService.getYears().toPromise();
      if (response) {
        this.years = response.data;
      }
    } catch (error) {
      this.years = [];
    }
  }

  async getMonths(year: any) {
    try {
      let response = await this.masterService.getMonths(year).toPromise();
      if (response) {
        this.months = response.data;
      }
    } catch (error) {
      this.months = [];
    }
  }

  async getBrands() {
    try {
      let response = await this.masterService.getBrandCode().toPromise();
      if (response) {
        this.brands = response.data;
      }
    } catch (error) {
      this.brands = [];
    }
  }

  async getStatus() {
    try {
      let response = await this.masterService.getStatus().toPromise();
      if (response) {
        this.status = response;
      }
    } catch (error) {
      this.status = [];
    }
  }

  async getStoreCodes() {
    try {
      let response = await this.masterService.getStoreCode().toPromise();
      if (response) {
        this.storeCodes = response.data;
      }
    } catch (error) {
      this.storeCodes = [];
    }
  }

  generateMonths(year: number) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    let maxMonth = 12;
    if (year === currentYear) {
      maxMonth = currentMonth;
    }
    this.months = [];
    for (let i = 1; i <= maxMonth; i++) {
      this.months.push({ month: monthNames[i - 1], month_no: i });
    }
  }

  async onYearChange(event: any) {
    const selectedYear = event.target.value;
    this.tempFilter.year = selectedYear ? Number(selectedYear) : null;
    this.tempFilter.month = null;
    this.months = [];
    if (this.tempFilter.year) {
      this.generateMonths(this.tempFilter.year);
    }
  }

  async onMonthChange(event: any) {
    const selectedMonth = event.target.value;
    this.tempFilter.month = selectedMonth ? Number(selectedMonth) : null;
  }

  async onDateRangeChange(value?: any) {
    this.tempFilter.dateRange = value || null
  }

  async onBrandChange(event: any) {
    const selectedBrand = event.target.value;
    this.tempFilter.brand = selectedBrand || null;
  }

  onStoreCodeChange(event: any) {
    const selectedStoreCode = event.target.value;
    this.tempFilter.storeCode = selectedStoreCode || null;
  }

  onStatusChange(event: any) {
    const selectedStatus = event.target.value;
    this.tempFilter.status = selectedStatus || null;
  }

  getMonthText = (monthNumber: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || 'Unknown';
  };


  sortAndReindex(data: any[], field: string): any[] {
    const sorted = [...data].sort((a, b) => {
      const dateA = this.parseDate(a[field]);
      const dateB = this.parseDate(b[field]);
      return dateB.getTime() - dateA.getTime();
    });
    return sorted.map((row, i) => ({ ...row, rowNum: i + 1 }));
  }

   async loadFilterDropdowns() {
    this.isLoadBrand = true;
    this.isLoadYear = true;
    this.isLoadStoreCode = true
    this.isLoadStatus = true
    await Promise.all([
      this.getBrands(),
      this.getYears(),
      this.getStoreCodes(),
      this.getStatus()
    ]);
    this.isLoadBrand = false;
    this.isLoadYear = false;
    this.isLoadStoreCode = false
    this.isLoadStatus = false
  }


} 