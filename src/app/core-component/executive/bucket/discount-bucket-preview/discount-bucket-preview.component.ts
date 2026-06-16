import { Component, Input, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ListService } from 'src/app/core/service/list/list.service';
import { ClientService } from 'src/app/core/service/client/client.service';
import { FileService } from 'src/app/core/service/file/file.service';
import Swal from 'sweetalert2';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  SizeColumnsToContentStrategy,
} from 'ag-grid-community';
import { ExcelStyleFilterComponent } from '../excel-style-filter/excel-style-filter.component';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';

@Component({
  selector: 'app-discount-bucket-preview',
  standalone: false,
  templateUrl: './discount-bucket-preview.component.html',
  styleUrl: './discount-bucket-preview.component.scss',
})
export class DiscountBucketPreviewComponent {
  @Input() modalParams: any;
  fileData: any;
  clientId: any;
  allUploadedData: any[] = [];
  filteredUploadedData: any[] = [];
  headerNames: string[] = [];
  tableData: any[] = [];
  loading: boolean = false;
  standardHeaders: string[] = [];
  headerMappings: any[] = [];
  stateId: number = 0;
  dualHeaderActive = false;
  displayHeaders: string[] = [];
  batchName: string = '';
  fullData: any[] = [];
  downloadExcel: boolean = false;
  @ViewChild('agGrid') agGrid!: AgGridAngular;
  autoSizeStrategy: SizeColumnsToContentStrategy = {
    type: 'fitCellContents',
    defaultMaxWidth: 200,
    defaultMinWidth: 50,
    columnLimits: [
      {
        colId: 'rowNum',
        maxWidth: 20,
        minWidth: 20,
      },
    ],
  };
  getRowClass = (params: any) => {
    if (params.node.rowPinned === 'top') {
      return 'excel-header-2';
    }
    return '';
  };
  public gridApi!: GridApi;
  public columnDefs: ColDef[] = [
    {
      headerName: '#',
      field: 'rowNum',
      width: 20,
      minWidth: 50,
      pinned: 'left',
      filter: false,
      sortable: false,
    },
    { headerName: 'Uploaded On', field: 'uploaded_on', width: 100 },
    { headerName: 'Month', field: 'month', width: 100 },
    { headerName: 'Year', field: 'year', width: 100 },
    { headerName: 'Customer Code', field: 'store_code', width: 130 },
    { headerName: 'Brand', field: 'brand', width: 100 },
    { headerName: 'Customer Name', field: 'store_name', width: 200 },
    { headerName: 'Bill No', field: 'bill_no', width: 120 },
    {
      headerName: 'Secondary Bill Date',
      field: 'secondary_bill_date',
      width: 150,
    },
    {
      headerName: 'Material Style Code',
      field: 'material_style_code',
      width: 160,
    },
    { headerName: 'EAN', field: 'ean', width: 120 },
    { headerName: 'QTY', field: 'qty', width: 80 },
    { headerName: 'MRP Per Unit', field: 'mrp_per_unit', width: 130 },
    { headerName: 'TOT MRP', field: 'tot_mrp', width: 100 },
    { headerName: 'Discount', field: 'discount', width: 100 },
    { headerName: 'NSV', field: 'nsv', width: 100 },
    { headerName: 'Remark', field: 'remark', width: 100 },
  ];
  public rowData: any[] = [];
  public pinnedTopRowData: any[] = [];
  public defaultColDef: any = {
    filter: ExcelStyleFilterComponent,
    cellClass: 'excel-cell',
    headerClass: 'excel-header',
    minWidth: 100,
    flex: 1,
    wrapText: true,
    autoHeight: true,
    headerTooltip: (params: any) => params.colDef?.headerName || '',
    resizable: true,
    sortable: true,
  };
  public gridOptions: GridOptions = {
    context: {
      componentParent: this,
    },
    defaultColDef: this.defaultColDef,
    theme: 'legacy',
    suppressCellFocus: true,
    suppressRowHoverHighlight: true,
    rowHeight: 22,
    headerHeight: 24,
    rowModelType: 'clientSide',
    rowClass: 'excel-row',
    suppressHorizontalScroll: false,
    animateRows: true,
    onFilterChanged: () => {
      this.anyFilterActive = this.gridApi.isAnyFilterPresent();
    },
    getRowClass: this.getRowClass,
  };
  public anyFilterActive: boolean = false;
  clients: any = [];

  constructor(
    private activeModal: NgbActiveModal,
    private listService: ListService,
    private modalService: NgbModal,
    private clientService: ClientService,
    private fileService: FileService,
    private commonSharedService: CommonSharedService
  ) {}

  ngOnInit() {
    this.batchName = this.modalParams.batchName || '';
    this.getUploadedFiles();
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

  async getUploadedFiles() {
    try {
      this.loading = true;
      const filter = {
        batch_id: this.modalParams.batchId || '',
      };

      const response = await this.listService.getDataList(filter).toPromise();
      if (response) {
        this.allUploadedData = this.formatGridData(response);
        this.filteredUploadedData = [...this.allUploadedData];
        this.rowData = this.filteredUploadedData;
      }
    } catch (error) {
      this.allUploadedData = [];
      this.filteredUploadedData = [];
      this.rowData = [];
    } finally {
      this.loading = false;
    }
  }

  createColumnDefs(headerRow: any): ColDef[] {
    return Object.keys(headerRow).map((key) => ({
      headerName: key,
      field: key,
      filter: ExcelStyleFilterComponent,
      valueGetter: (params: any) => {
        return params.data?.[key];
      },
      cellRenderer: (params: any) => {
        const div = document.createElement('div');
        div.innerText = params.value || '';
        div.title = params.value || '';
        div.className = 'ag-cell-content';
        return div;
      },
    }));
  }

  formatRowData(data: any[], headers: string[]): any[] {
    return data.map((row: any) => {
      const formatted: any = {};
      headers.forEach((key) => {
        formatted[key] = this.formatValue(row[key]);
      });
      return formatted;
    });
  }

  private formatGridData(data: any[]): any[] {
    return data.map((row, index) => {
      const formattedRow: any = {
        rowNum: index + 1,
        secondary_bill_date_format: (() => {
          const d = new Date(row.secondary_bill_date);
          return !isNaN(d.getTime()) ? row.secondary_bill_date.match(/^\d{4}-\d{2}-\d{2}T/) ? 'Proper' : 'Improper' : 'Improper';
        })(),
      };
      Object.keys(row).forEach((key) => {
        formattedRow[key] = this.formatValue(row[key]);
      });
      return formattedRow;
    });
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    setTimeout(() => {
      const columnIds: string[] = [];

      this.gridApi.getColumns()?.forEach((col) => {
        const colId = col.getColId();
        if (colId !== 'action' && colId !== 'rowNum') {
          columnIds.push(colId);
        }
      });
      this.gridApi.autoSizeColumns(columnIds, false);
    }, 100);
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
      const date = new Date(value);
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }

    return value;
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

    const exportData = dataToExport.map((row: any, index: any) => ({
      'S.No': index + 1,
      'Uploaded On': row.uploaded_on,
      Month: row.month,
      Year: row.year,
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
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Discount Bucket Data': worksheet },
      SheetNames: ['Discount Bucket Data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, `${this.batchName}.xlsx`);
    this.downloadExcel = false;
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
    this.gridApi.onFilterChanged();
    window.dispatchEvent(new Event('filterChanged'));
    this.anyFilterActive = false;
  }

  closeModal() {
    this.activeModal.close();
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

  async bulkDownloadSoList() {
    try {
      let clientId = this.modalParams.clientId;
      if (!clientId) {
        alert('Please select a client first');
        return;
      }
      if (!this.clients || this.clients.length === 0) {
        await this.getClients();
      }
      const matchedClient = this.clients.find(
        (client: any) => client.uuid === clientId
      );
      if (matchedClient?.id) {
        clientId = matchedClient.id;
      } else {
        alert('Client not found. Please refresh clients list.');
        return;
      }
      this.downloadExcel = true;
      const filter = {
        client_id: clientId,
        batch_id: this.modalParams.batchId,
      };
      const fileName = 'discount-file.xlsx';
      const response = await this.listService
        .downloadSoList(filter)
        .toPromise();
      if (response) {
        this.commonSharedService.downloadBlobFile(response, fileName);
        this.downloadExcel = false;
      }
    } catch (error) {
      console.error('Error downloading SO list:', error);
      alert('Error downloading SO list. Please try again.');
      this.downloadExcel = false;
    } finally {
      this.downloadExcel = false;
    }
  }
}
