import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { routes } from 'src/app/core/helpers/routes';
import { ListService } from 'src/app/core/service/list/list.service';
import { TrackerService } from 'src/app/core/service/tracker/tracker.service';
import { ClientService } from 'src/app/core/service/client/client.service';
import { formatDate } from '@angular/common';
import {
  BsDatepickerConfig,
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
import { ExcelStyleFilterComponent } from '../excel-style-filter/excel-style-filter.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from 'src/app/core/service/master/master.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tracker',
  standalone: false,
  templateUrl: './tracker.component.html',
  styleUrl: './tracker.component.scss',
})
export class TrackerComponent {
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
  clientUuid: any = '';
  private clientSub!: Subscription;
  clientId: any;
  loading: boolean = false;
  applyDateFilterClicked: boolean = false;
  downloadExcel: boolean = false;
  columnDefs: ColDef[] = [
    {
      headerName: '#',
      field: 'rowNum',
      width: 50,
      minWidth: 40,
      maxWidth: 60,

    },
    {
      headerName: 'Customer Code',
      field: 'customer_code',
      width: 100,
      minWidth: 100,
      maxWidth: 120
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
      headerName: 'Customer Name',
      field: 'customer_name',
      minWidth: 180,
      flex: 1,
      wrapText: true,
      autoHeight: true,
      cellClass: 'wrap-cell'
    },
    {
      headerName: 'Brand',
      field: 'brand',
      width: 60,
      minWidth: 60,
      maxWidth: 70
    },
    {
      headerName: 'Region',
      field: 'customer_region',
      width: 60,
      minWidth: 60,
      maxWidth: 70
    },
    {
      headerName: 'State',
      field: 'customer_state',
      width: 80,
      minWidth: 80,
      maxWidth: 100,
      wrapText: true,
      autoHeight: true,
      cellClass: 'wrap-cell'
    },
    {
      headerName: 'City',
      field: 'customer_city',
      width: 80,
      minWidth: 80,
      maxWidth: 100
    },
    {
      headerName: 'Uploaded On',
      field: 'uploaded_on',
      width: 90,
      minWidth: 90,
      maxWidth: 120
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
    adaptivePosition: false,
  };
  filter = {
    year: null as number | null,
    month: null as number | null,
    region: null as string | null,
    brand: null as string | null,
  };
  years: any = [];
  yearUuid: any
  months: any = []
  monthUuid: any
  regions: any = []
  regionId: any
  brandNames: any = []
  brandName: any

  tempYearUuid: any = '';
  tempMonthUuid: any = '';
  tempRegionId: any = '';
  tempBrandName: any = '';

  isLoadBrand: boolean = false
  isLoadYear: boolean =  false
  isLoadRegion: boolean = false


  constructor(
    private masterService: MasterService,
    private clientService: ClientService,
    private trackerService: TrackerService,
    private commonSharedService: CommonSharedService,
    private modalService: NgbModal,
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
              await this.getUploadedFiles();
            }
          }else{
              this.clientUuid = res.uuid
             await this.getUploadedFiles();
          }
        }
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

  async handleClientSelection(uuid: string) {
    await this.getClients();
    const matchedClient = this.clients.find(
      (client: any) => client.uuid === uuid
    );
    if (matchedClient?.id) {
      await this.getUploadedFiles();
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

  async getUploadedFiles() {
    try {
      this.loading = false;
      if (this.gridApi) {
        this.gridApi.setGridOption('loading', true);
      }
      const filter = {
        client_id: this.clientId || '',
        batch_id: null,
      };
      const clientId = this.clientUuid || ""
      const year = this.tempYearUuid || ""
      const month = this.tempMonthUuid || ""
      const brand = this.tempBrandName || ""
      const region = this.tempRegionId || ""
      const response = await this.trackerService.getDataTrackers(clientId,
        year, month, region, brand
      ).toPromise();
      if (response) {
        this.allUploadedData = response.map((row: any, index: number) => {
          const rawDate = row.secondary_bill_date
            ?.toString()
            ?.replace(/[\u2011\u2012\u2013\u2014\u2015]/g, '-');
          const parsedDate = new Date(rawDate);
          row._parsedDate = !isNaN(parsedDate.getTime()) ? parsedDate : null;
          row.secondary_bill_date = row._parsedDate
            ? formatDate(row._parsedDate, 'dd-MM-yyyy', 'en-IN', 'UTC')
            : '';
          if (row.uploaded_on) {
            const uploadedDate = new Date(row.uploaded_on);
            if (!isNaN(uploadedDate.getTime())) {
              row.uploaded_on = formatDate(uploadedDate, 'dd-MM-yyyy', 'en-IN');
            }
          }
          if (row.month) {
            row.month = this.getMonthText(row.month);
          }
          row.rowNum = index + 1;
          return row;
        });
        this.filteredUploadedData = [...this.allUploadedData];
      }
      else {
        this.allUploadedData = [];
        this.filteredUploadedData = [];
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

  getMonthText = (monthNumber: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || 'Unknown';
  };
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
        'Customer Code': row.customer_code,
        'Customer Name': row.customer_name,
        'Brand': row.brand,
        'Region': row.customer_region,
        'State': row.customer_state,
        'City': row.customer_city,
        'Month': row.month,
        'Year': row.year,
        'Uploaded On': row.uploaded_on,

      })
    );

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Tracker Data': worksheet },
      SheetNames: ['Tracker Data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'tracker-data.xlsx');
    this.downloadExcel = false;
  }


  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    if (this.loading) {
      this.gridApi.setGridOption('loading', true);
    }
  }

  async openDateFilterModal() {
    this.tempYearUuid = this.filter.year || '';
    this.tempMonthUuid = this.filter.month || '';
    this.tempRegionId = this.filter.region || '';
    this.tempBrandName = this.filter.brand || '';
    this.modalService.open(this.dateFilterModal, {
      backdrop: 'static',
      size: 'md',
      windowClass: 'date-filter-modal',
    });
    this.loadFilterDropdowns();
  }

  async resetTempDateFields(modal: any) {
    this.tempYearUuid = '';
    this.tempMonthUuid = '';
    this.tempRegionId = '';
    this.tempBrandName = '';
    this.months = [];
    this.brandNames = [];
    this.filter.year = null;
    this.filter.month = null;
    this.filter.region = null;
    this.filter.brand = null;
    await this.getUploadedFiles();
    modal.close();
    // this.filteredUploadedData = [...this.allUploadedData];
  }

  isAllFiltersSelected(): boolean {
    return !!(this.tempYearUuid && this.tempMonthUuid && this.tempRegionId && this.tempBrandName);
  }

  async applyDateFilter(modal: any) {
    this.applyDateFilterClicked = true;
    this.filter.year = Number(this.tempYearUuid)
    this.filter.month = this.tempMonthUuid;
    this.filter.region = this.tempRegionId;
    this.filter.brand = this.tempBrandName;
    await this.getUploadedFiles();
    this.applyDateFilterClicked = false;
    modal.close();
  }

  getMonthNumber(monthName: string): number {
    const monthMap: { [key: string]: number } = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4,
      'May': 5, 'June': 6, 'July': 7, 'August': 8,
      'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    return monthMap[monthName] || 0;
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

  clearAllFilters(): void {
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
    this.filter.year = null;
    this.filter.month = null;
    this.filter.region = null;
    this.filter.brand = null;
    this.tempYearUuid = '';
    this.tempMonthUuid = '';
    this.tempRegionId = '';
    this.tempBrandName = '';
    this.months = [];
    this.brandNames = [];
    //  this.filteredUploadedData = this.allUploadedData;
    this.getUploadedFiles()
    this.gridApi.onFilterChanged();
    window.dispatchEvent(new Event('filterChanged'));
    this.anyFilterActive = false;
  }

  isAnyFilterActive(): boolean {
    const hasModalFilters = !!(this.filter.year || this.filter.month || this.filter.region || this.filter.brand);
    const hasGridFilters = this.gridApi?.isAnyFilterPresent?.() || false;
    return hasModalFilters || hasGridFilters;
  }

  get isFilterActive(): boolean {
    return !!(this.filter.year && this.filter.month && this.filter.region && this.filter.brand);
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

  async getRegions() {
    try {
      let response = await this.masterService.getRegions().toPromise();
      if (response) {
        this.regions = response.data;
      }
    } catch (error) {
      this.regions = [];
    }
  }

  async getBrands() {
    try {
      let response = await this.masterService.getBrandCode().toPromise();
      if (response) {
        this.brandNames = response.data;
      }
    } catch (error) {
      this.brandNames = [];
    }
  }

  getSelectedYear(event: any) {
    if (event.target.value == '') {
      this.tempYearUuid = '';
      this.tempMonthUuid = '';
      this.tempBrandName = '';
      this.months = [];
    }
    else {
      this.yearUuid = Number(event.target.value)
      this.tempMonthUuid = '';
      this.generateMonths(this.yearUuid)

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

  getSelectedMonth(event: any) {
    if (event.target.value == '') {
      this.tempMonthUuid = '';
    }
    else {
      this.tempMonthUuid = Number(event.target.value);
    }
  }

  getSelectedRegion(event: any) {
    if (event.target.value == '') {
      this.tempRegionId = '';
    }
    else {
      this.tempRegionId = event.target.value;
    }
  }

  async loadFilterDropdowns() {
  this.isLoadBrand = true;
  this.isLoadYear = true;
  this.isLoadRegion = true;

  await Promise.all([
    this.getBrands(),
    this.getYears(),
    this.getRegions(),
  ]);

  this.isLoadBrand = false;
  this.isLoadYear = false;
  this.isLoadRegion = false;
}


}
