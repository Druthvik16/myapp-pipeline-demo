import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { routes } from 'src/app/core/helpers/routes';
import { ListService } from 'src/app/core/service/list/list.service';
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
import { ExcelStyleFilterComponent } from '../excel-style-filter/excel-style-filter.component';
import { DiscountBucketModalComponent } from '../discount-bucket-modal/discount-bucket-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from 'src/app/core/service/master/master.service';
import { UploadedDataPreviewComponent } from '../uploaded-data-preview/uploaded-data-preview.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-uploaded-data',
  standalone: false,
  templateUrl: './uploaded-data.component.html',
  styleUrl: './uploaded-data.component.scss',
})
export class UploadedDataComponent {
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
  userData: any;
  columnDefs: ColDef[] = [];
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

  applyDateFilterClicked: boolean = false;
  gridOptions: GridOptions = {
    context: {
      componentParent: this,
    },
    onFilterChanged: () => {
      this.anyFilterActive = this.gridApi.isAnyFilterPresent();
    },
    onSelectionChanged: () => {
      this.onSelectionChanged();
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
  rowsSelected: boolean = false;
  @ViewChild('dateFilterModal') dateFilterModal!: TemplateRef<any>;
  bsDateConfig: Partial<BsDaterangepickerConfig> = {
    dateInputFormat: 'DD/MM/YYYY',
    rangeInputFormat: 'DD/MM/YYYY',
    containerClass: 'theme-default',
    showWeekNumbers: false,
    adaptivePosition: false,
  };
  tempUploadedOnRange: Date[] | null = null;
  tempSecondaryBillRange: Date[] | null = null;
  filter = {
    year: null as any,
    month: null as any,
    brand: null as any,
    dateRange: null as Date[] | null,
  };
  tempFilter = { ...this.filter };
  years: any = [];
  months: any = []
  brands: any = []
  bulkDownloadLoading = false;

  isLoadBrand: boolean = false
  isLoadYear: boolean = false

  constructor(
    private listService: ListService,
    private clientService: ClientService,
    private commonSharedService: CommonSharedService,
    private modalService: NgbModal,
    private masterService: MasterService
  ) {
    this.userData = JSON.parse(sessionStorage.getItem('LOGINUSER') || '{}');
    this.columnDefs = [
      {
        headerName: '',
        field: '',
        checkboxSelection: this.userData?.user?.user_type != 'Executive',
        headerCheckboxSelection: this.userData?.user?.user_type != 'Executive',
        headerCheckboxSelectionFilteredOnly: true,
        pinned: 'left',
        width: 50,
        minWidth: 50,
        maxWidth: 50,
        suppressSizeToFit: true,
        filter: false,
        cellClass: 'ag-cell ag-selection-checkbox',
        suppressMovable: true,
        hide: this.userData?.user?.user_type === 'Executive'
      },
      {
        headerName: '#',
        field: 'rowNum',
        width: 40,
        minWidth: 40,
        maxWidth: 60,
        pinned: 'left',
        filter: false,
        sortable: false,
        suppressSizeToFit: true
      },
      {
        headerName: 'Customer Code',
        field: 'customer_code',
        width: 120,
        minWidth: 100
      },
      {
        headerName: 'Month',
        field: 'month_name',
        width: 80,
        minWidth: 80
      },
      {
        headerName: 'Year',
        field: 'year',
        width: 80,
        minWidth: 80
      },
      {
        headerName: 'Brand',
        field: 'brand',
        width: 80,
        minWidth: 80
      },
      {
        headerName: 'Customer Name',
        field: 'customer_name',
        flex: 1,
        wrapText: true,
        autoHeight: true,
        cellClass: 'wrap-cell'
      },
      {
        headerName: 'Uploaded On',
        field: 'last_uploaded_on',
        width: 90,
        minWidth: 90
      },
      {
        headerName: 'Number of Rows',
        field: 'total_count',
        width: 120,
        minWidth: 100
      },
      {
        headerName: 'View',
        field: 'action',
        width: 100,
        minWidth: 80,
        cellRenderer: (params: any) => {
          const anchor = document.createElement('a');
          anchor.className = 'me-2 p-2';
          anchor.title = 'Open File';
          anchor.style.cursor = 'pointer';
          const icon = document.createElement('i');
          icon.className = 'feather icon-eye feather-eye';
          icon.addEventListener('click', () => {
            this.openUploadedDataPreview(
              params, 'single'
            );
          });
          anchor.appendChild(icon);
          return anchor;
        }
      }
    ];
  }

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
            this.clientUuid = res.uuid || '';
            await this.getClients();
            const matchedClient = this.clients.find(
              (client: any) => client.uuid === this.clientUuid
            );
            if (matchedClient?.id) {
              this.clientId = matchedClient?.id
              await this.getUploadedFiles();
            }
          } else {
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
      this.loading = true;
      if (this.gridApi) {
        this.gridApi.setGridOption('loading', true);
      }
      const filter = {
        client_id: this.clientId || '',
        // batch_id: null,
      };
      const clientId = this.clientUuid || ""
      const year = this.tempFilter.year || ""
      const month = this.tempFilter.month || ""
      const brand = this.tempFilter.brand || ""
      const fromDate = this.tempFilter.dateRange?.[0]
        ? formatDate(this.tempFilter.dateRange[0], 'yyyy-MM-dd', 'en-IN')
        : "";
      const toDate = this.tempFilter.dateRange?.[1]
        ? formatDate(this.tempFilter.dateRange[1], 'yyyy-MM-dd', 'en-IN')
        : "";
      // const response = await this.listService.getDataList(filter).toPromise();
      const response = await this.listService.getFileList(clientId,
        year, month, brand, fromDate, toDate
      ).toPromise();
      if (response) {
        this.allUploadedData = response.map((row: any, index: number) => {
          row.secondary_bill_date_format = (() => {
            const d = new Date(row.secondary_bill_date);
            return !isNaN(d.getTime()) ? row.secondary_bill_date.match(/^\d{4}-\d{2}-\d{2}T/) ? 'Proper' : 'Improper' : 'Improper';
          })();
          const rawDate = row.secondary_bill_date
            ?.toString()
            ?.replace(/[\u2011\u2012\u2013\u2014\u2015]/g, '-');
          const parsedDate = new Date(rawDate);
          row._parsedDate = !isNaN(parsedDate.getTime()) ? row.secondary_bill_date.match(/^\d{4}-\d{2}-\d{2}T/) ? parsedDate : null : null;
          row.last_uploaded_on = row._parsedDate
            ? formatDate(row._parsedDate, 'dd-MM-yyyy', 'en-IN', 'UTC')
            : row.last_uploaded_on;
          row.secondary_bill_date = row._parsedDate
            ? formatDate(row._parsedDate, 'dd-MM-yyyy', 'en-IN', 'UTC')
            : row.secondary_bill_date;
          if (row.last_uploaded_on) {
            const uploadedDate = new Date(row.last_uploaded_on);
            if (!isNaN(uploadedDate.getTime())) {
              row.last_uploaded_on = formatDate(uploadedDate, 'dd/MM/yyyy', 'en-IN');
            }
          }
          row.rowNum = index + 1;
          return row;
        });
        this.filteredUploadedData = [...this.allUploadedData];
      } else {
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
      (row: any, index: any) => ({
        'S.No': index + 1,
        'Uploaded On': row.last_uploaded_on,
        'Month': row.month,
        'Year': row.year,
        'Customer Code': row.store_code,
        Brand: row.brand,
        'Customer Name': row.store_name,
        'Bill No': row.bill_no,
        'Secondary Bill Date': row.secondary_bill_date,
        'Secondary Bill Date Format': row.secondary_bill_date_format,
        'Material Style Code': row.material_style_code,
        EAN: row.ean,
        QTY: row.qty,
        'MRP Per Unit': row.mrp_per_unit,
        'TOT MRP': row.tot_mrp,
        Discount: row.discount,
        NSV: row.nsv,
        Remark: row.remark,
      })
    );
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Uploaded Data': worksheet },
      SheetNames: ['Uploaded Data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'uploaded-data.xlsx');
    this.downloadExcel = false;
  }

  bulkDownloadSoList(): void {
    if (!this.clientId) {
      alert('Please select a client first');
      return;
    }
    this.bulkDownloadLoading = true;
    const filter = {
      client_id: this.clientId,
      batch_id: null
    };
    this.listService.downloadSoList(filter).subscribe({
      next: (response: Blob) => {
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        FileSaver.saveAs(blob, 'so-list.xlsx');
        this.bulkDownloadLoading = false;
      },
      error: (error: any) => {
        console.error('Error downloading SO list:', error);
        alert('Error downloading SO list. Please try again.');
        this.bulkDownloadLoading = false;
      }
    });
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    if (this.loading) {
      this.gridApi.setGridOption('loading', true);
    }
  }

  onSelectionChanged(): void {
    const selectedRows = this.gridApi?.getSelectedRows();
    this.rowsSelected = selectedRows && selectedRows.length > 0;
  }

  get isAnyRowSelected(): boolean {
    const selectedRows = this.gridApi?.getSelectedRows();
    return selectedRows && selectedRows.length > 0;
  }

  getSelectedRows(): any[] {
    return this.gridApi?.getSelectedRows() || [];
  }

  clearAllSelections(): void {
    this.gridApi?.deselectAll();
  }

  selectAllVisible(): void {
    this.gridApi?.selectAll();
  }

  bulkView(): void {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      return;
    }

    const params = { data: {} }
    params.data = selectedRows

    this.openUploadedDataPreview(params, 'multiple')
  }

  get isDateFilterActive(): boolean {
    return !!(
      this.filter.year ||
      this.filter.month ||
      this.filter.dateRange?.length === 2 ||
      this.filter.brand
    );
  }

  async openDateFilterModal() {
    this.tempFilter = { ...this.filter };
    this.tempFilter.dateRange = this.filter.dateRange;
    this.modalService.open(this.dateFilterModal, {
      backdrop: 'static',
      size: 'md',
      windowClass: 'date-filter-modal',
    })
    this.loadFilterDropdowns();
  }

  async resetTempDateFields(modal: any) {
    this.tempFilter = {
      year: null,
      month: null,
      dateRange: null,
      brand: null,
    };
    this.months = [];
    this.brands = [];
    this.filter = { ...this.tempFilter };
    await this.getUploadedFiles()
    modal.close();
  }

  async applyDateFilter(modal: any) {
    this.applyDateFilterClicked = true;
    this.filter = { ...this.tempFilter };
    this.filter.dateRange = this.tempFilter.dateRange;
    await this.getUploadedFiles()
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
    this.tempFilter = {
      year: null,
      month: null,
      dateRange: null,
      brand: null,
    };
    this.months = [];
    this.brands = [];
    this.filter = { ...this.tempFilter };
    await this.getUploadedFiles()
    this.gridApi.onFilterChanged();
    window.dispatchEvent(new Event('filterChanged'));
    this.anyFilterActive = false;
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

  get isApplyDisabled(): boolean {
    return !(
      this.tempFilter.year &&
      this.tempFilter.month &&
      this.tempFilter.dateRange &&
      this.tempFilter.brand
    );
  }

  isAnyFilterActive(): boolean {
    const hasDate = this.filter.dateRange?.length === 2;
    const hasYear = !!this.filter.year;
    const hasMonth = !!this.filter.month;
    const hasBrand = !!this.filter.brand;
    const hasGridFilters = this.gridApi?.isAnyFilterPresent?.() || false;
    return hasDate || hasYear || hasBrand || hasMonth || hasGridFilters;
  }

  async openUploadedDataPreview(params: any, action: string) {
    if (!this.clientId && this.clientUuid) {
      await this.getClients();
      const matchedClient = this.clients.find((c: any) => c.uuid === this.clientUuid);
      this.clientId = matchedClient?.id || '';
    }
    const dialogRef = this.modalService.open(UploadedDataPreviewComponent, {
      backdrop: 'static',
      modalDialogClass: 'modal-fullscreen',
    });
    let title = ''
    let filter: any = {}
    if (action == 'single') {
      let d = params.data.last_uploaded_on ? params.data.last_uploaded_on?.split('/') : null
      const brandName = params.data.brand || 'N/A';
      const customerName = params.data.customer_name || 'N/A';
      const last_uploaded_on = d ? d[2] + '-' + d[1] + '-' + d[0] : 'N/A';
      title = brandName + ' | ' + customerName
      filter = {
        client_id: this.clientId,
        store_code: params.data.customer_code,
        brand: brandName,
        batch_id: null,
        year: params.data.year,
        month: params.data.month,
        file_id: params.data.file_id,
        uploaded_on: last_uploaded_on
      }
    }
    else if (action == 'multiple') {
      title = ''
      const brand = params.data.map((ele: any) => ele.brand)
      const store_code = params.data.map((ele: any) => ele.customer_code)
      const year = params.data.map((ele: any) => ele.year)
      const month = params.data.map((ele: any) => ele.month)
      const file_id = params.data.map((ele: any) => ele.file_id)
      const last_uploaded_on = params.data.map((ele: any) => {
        let d = ele.last_uploaded_on ? ele.last_uploaded_on?.split('/') : null;
        console.log(ele.last_uploaded_on, d)
        return d ? d[2] + '-' + d[1] + '-' + d[0] : ''
      });

      params.data.forEach((ele: any, index: number) => {
        if (index > 3) {
          return
        }
        const brandName = ele.brand || 'N/A';
        const customerName = ele.customer_name || 'N/A';
        title += ' ( ' + brandName + ' | ' + customerName + ' ) '

        if (index == 3) {
          title = ' ' + title.trim() + '...'
        }
      })

      filter = {
        client_id: this.clientId,
        file_id,
        store_code,
        brand,
        batch_id: null,
        year,
        month,
        uploaded_on: last_uploaded_on
      }
      console.log(filter)
    }
    dialogRef.componentInstance.modalParams = { title, "uploadedData": params.data, "clientId": this.clientId, filter };
    dialogRef.closed.subscribe((result) => {
      if (result && result.isBatchCreated) {
        this.getUploadedFiles();
      }
    });
  }

  async loadFilterDropdowns() {
    this.isLoadBrand = true;
    this.isLoadYear = true;
    await Promise.all([
      this.getBrands(),
      this.getYears(),
    ]);
    this.isLoadBrand = false;
    this.isLoadYear = false;
  }

  ngOnDestroy() {
    this.clientSub?.unsubscribe();
  }
}
