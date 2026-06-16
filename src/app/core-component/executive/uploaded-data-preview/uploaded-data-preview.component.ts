import { formatDate } from '@angular/common';
import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { BsDaterangepickerConfig } from 'ngx-bootstrap/datepicker';
import { Subscription } from 'rxjs';
import { routes } from 'src/app/core/helpers/routes';
import { ClientService } from 'src/app/core/service/client/client.service';
import { ListService } from 'src/app/core/service/list/list.service';
import { DiscountBucketModalComponent } from '../discount-bucket-modal/discount-bucket-modal.component';
import { ExcelStyleFilterComponent } from '../excel-style-filter/excel-style-filter.component';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-uploaded-data-preview',
  standalone: false,
  templateUrl: './uploaded-data-preview.component.html',
  styleUrl: './uploaded-data-preview.component.scss'
})
export class UploadedDataPreviewComponent {
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
  isBatchCreated = false;
  columnDefs: ColDef[] = [];
  
  applyDateFilterClicked: boolean = false;
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
    onSelectionChanged: () => {
      this.onSelectionChanged();
    },
    defaultColDef: this.defaultColDef,
    theme: 'legacy',
    suppressCellFocus: false,
    rowHeight: 22,
    headerHeight: 24,
    animateRows: true,
    suppressRowHoverHighlight: false,
    suppressRowClickSelection: false,
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
    uploadedOnRange: null as Date[] | null,
    secondaryBillRange: null as Date[] | null,
  };
  @Input() modalParams: any;
  fileName: string = '';
  title: string = '';
  brandName: string = '';
  customerName: string = '';
  totalCount: number = 0;

  constructor(
    private listService: ListService,
    private clientService: ClientService,
    private modalService: NgbModal,
    private activeModal: NgbActiveModal
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
        headerName: 'Uploaded On',
        field: 'uploaded_on',
        width: 90,
        minWidth: 90,
        maxWidth: 110
      },
      {
        headerName: 'Month',
        field: 'month',
        width: 60,
        minWidth: 60,
        maxWidth: 90
      },
      {
        headerName: 'Year',
        field: 'year',
        width: 60,
        minWidth: 60,
        maxWidth: 70
      },
      {
        headerName: 'Customer Code',
        field: 'store_code',
        width: 100,
        minWidth: 100,
        maxWidth: 110
      },
      {
        headerName: 'Brand',
        field: 'brand',
        width: 60,
        minWidth: 60,
        maxWidth: 70
      },
      {
        headerName: 'Customer Name',
        field: 'store_name',
        minWidth: 180,
        flex: 1,
        wrapText: true,
        autoHeight: true,
        cellClass: 'wrap-cell'
      },
      {
        headerName: 'Bill No',
        field: 'bill_no',
        width: 70,
        minWidth: 70,
        wrapText: true,
        autoHeight: true,
        cellClass: 'wrap-cell'
      },
      {
        headerName: 'Secondary Bill Date',
        field: 'secondary_bill_date',
        width: 130,
        minWidth: 120,
        maxWidth: 150
      },
      {
        headerName: 'Material Style Code',
        field: 'material_style_code',
        width: 130,
        minWidth: 130,
        maxWidth: 150
      },
      {
        headerName: 'EAN',
        field: 'ean',
        width: 100,
        minWidth: 100,
        maxWidth: 120
      },
      {
        headerName: 'QTY',
        field: 'qty',
        width: 50,
        minWidth: 50,
        maxWidth: 120
      },
      {
        headerName: 'MRP Per Unit',
        field: 'mrp_per_unit',
        width: 90,
        minWidth: 90,
        maxWidth: 120
      },
      {
        headerName: 'TOT MRP',
        field: 'tot_mrp',
        width: 80,
        minWidth: 80,
        maxWidth: 120
      },
      {
        headerName: 'Discount',
        field: 'discount',
        width: 70,
        minWidth: 70,
        maxWidth: 120
      },
      {
        headerName: 'NSV',
        field: 'nsv',
        width: 70,
        minWidth: 70,
        maxWidth: 120
      },
      {
        headerName: 'File Name',
        field: 'file_name',
        minWidth: 500,
        flex: 1,
      },
      {
        headerName: 'Remark',
        field: 'remark',
        minWidth: 120,
        flex: 0.8,
        wrapText: true,
        autoHeight: true,
        cellClass: 'wrap-cell'
      },
    ];

  }

  async ngOnInit() {
    this.title = this.modalParams.title
    // this.brandName = this.modalParams.uploadedData.brand || 'N/A';
    // this.customerName = this.modalParams.uploadedData.customer_name || 'N/A';
    // this.totalCount = this.modalParams.uploadedData.total_count || 0;
    await this.getUploadedFiles();
  }

  async handleClientSelection(uuid: string) {
    await this.getClients();
    const matchedClient = this.clients.find(
      (client: any) => client.uuid === uuid
    );
    if (matchedClient?.id) {
      this.clientId = matchedClient.id;
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
    //   const filter = {
    //     client_id: this.modalParams.clientId || '',
    //     store_code: this.modalParams.uploadedData.customer_code,
    //     brand: this.modalParams.uploadedData.customer_code.brand,
    //     batch_id: null
    //   };
    
      const filter = this.modalParams.filter
      const response = await this.listService.getDataList(filter).toPromise();
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
          row.secondary_bill_date = row._parsedDate
            ? formatDate(row._parsedDate, 'dd-MM-yyyy', 'en-IN')
            : row.secondary_bill_date;
          // Format bot_receiving_date date
          if (row.bot_receiving_date) {
            const uploadedDate = new Date(row.bot_receiving_date);
            if (!isNaN(uploadedDate.getTime())) {
              row.bot_receiving_date = formatDate(uploadedDate, 'dd-MM-yyyy', 'en-IN');
            }
          }
          if (row.uploaded_on) {
            const uploadedDate = new Date(row.uploaded_on);
            if (!isNaN(uploadedDate.getTime())) {
              row.uploaded_on = formatDate(uploadedDate, 'dd-MM-yyyy', 'en-IN');
            }
          }
          row.rowNum = index + 1;
          return row;
        });
        this.filteredUploadedData = [...this.allUploadedData];
        if (this.gridApi) {
          this.gridApi.setGridOption('loading', false);
        }
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
        'Uploaded On': row.uploaded_on,
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
    this.downloadExcel = true;
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
        this.downloadExcel = false;
      },
      error: (error: any) => {
        console.error('Error downloading SO list:', error);
        alert('Error downloading SO list. Please try again.');
        this.downloadExcel = false;
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

  createDiscountBucket(): void {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      return;
    }
    const modalRef = this.modalService.open(DiscountBucketModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.selectedData = selectedRows;
    modalRef.componentInstance.filteredData = this.filteredUploadedData;
    modalRef.closed.subscribe((result) => {
      if (result) {
        this.isBatchCreated = true;
        this.getUploadedFiles();
      }
    });
  }

  get isDateFilterActive(): boolean {
    return !!(this.filter.uploadedOnRange || this.filter.secondaryBillRange);
  }

  async openDateFilterModal() {
    this.tempUploadedOnRange = this.filter.uploadedOnRange;
    this.tempSecondaryBillRange = this.filter.secondaryBillRange;
    this.modalService.open(this.dateFilterModal, {
      backdrop: 'static',
      size: 'md',
      windowClass: 'date-filter-modal',
    });
  }

  resetTempDateFields(): void {
    this.tempUploadedOnRange = null;
    this.tempSecondaryBillRange = null;
  }

  applyDateFilter(modal: any): void {
    this.applyDateFilterClicked = true;
    this.filter.uploadedOnRange = this.tempUploadedOnRange;
    this.filter.secondaryBillRange = this.tempSecondaryBillRange;
    this.filteredUploadedData = this.allUploadedData.filter((row: any) => {
      const uploadedMatch = this.filter.uploadedOnRange
        ? this.isInRange(row.bot_receiving_date, this.filter.uploadedOnRange)
        : true;
      const billMatch = this.filter.secondaryBillRange
        ? this.isInRange(
          row.secondary_bill_date,
          this.filter.secondaryBillRange
        )
        : true;

      return uploadedMatch && billMatch;
    });
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
    this.filter.uploadedOnRange = null;
    this.filter.secondaryBillRange = null
    this.tempUploadedOnRange = null;
    this.tempSecondaryBillRange = null;
    this.filteredUploadedData = this.allUploadedData;
    this.gridApi.onFilterChanged();
    window.dispatchEvent(new Event('filterChanged'));
    this.anyFilterActive = false;
  }

  isAnyFilterActive(): boolean {
    const hasUploadedOn = this.filter.uploadedOnRange?.length === 2;
    const hasSecondaryBill = this.filter.secondaryBillRange?.length === 2;
    const hasModalFilters = hasUploadedOn || hasSecondaryBill;
    const hasGridFilters = this.gridApi?.isAnyFilterPresent?.() || false;
    return hasModalFilters || hasGridFilters;
  }

  closeModal() {
    this.activeModal.close({isBatchCreated : this.isBatchCreated});
  }

  ngOnDestroy() {
    this.clientSub?.unsubscribe();
  }
}
