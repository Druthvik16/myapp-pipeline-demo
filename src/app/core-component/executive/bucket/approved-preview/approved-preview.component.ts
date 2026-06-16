import { Component, Input, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FileService } from 'src/app/core/service/file/file.service';
import Swal from 'sweetalert2';
import { ScanningProcessComponent } from '../scanning-process/scanning-process.component';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  SizeColumnsToContentStrategy,
} from 'ag-grid-community';
import { ExcelStyleFilterComponent } from '../excel-style-filter/excel-style-filter.component';

@Component({
  selector: 'app-approved-preview',
  standalone: false,
  templateUrl: './approved-preview.component.html',
  styleUrl: './approved-preview.component.scss',
})
export class ApprovedPreviewComponent {
  @Input() modalParams: any;
  fileData: any;
  headerNames: string[] = [];
  tableData: any[] = [];
  loading: boolean = false;
  standardHeaders: string[] = [];
  headerMappings: any[] = [];
  stateId: number = 0;
  dualHeaderActive = false;
  displayHeaders: string[] = [];
  fileName: string = '';
  fullData: any[] = [];
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
  public columnDefs: ColDef[] = [];
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
  // File lock mechanism properties
  private pollingInterval: any;
  isFileLocked: boolean = false;
  lockMessage: string = '';
  userData: any;
  isScanning: boolean = false;

  constructor(
    private activeModal: NgbActiveModal,
    private fileService: FileService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.userData = JSON.parse(sessionStorage.getItem('LOGINUSER') || '{}');
    this.fileName = this.modalParams.fileName;
    this.getFileData(this.modalParams.fileId);
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

  async getFileData(id: any) {
    this.loading = true;
    try {
      const response = await this.fileService.getFileData(id).toPromise();
      if (response && response.data?.length > 0) {
        this.fileData = response;
        if (![4, 8].includes(this.fileData?.state_id)) {
          this.activeModal.close('forceReload');
          this.showNotification(
            'info',
            'This file was already edited successfully.',
            'info'
          );
          return;
        }
        this.fullData = response.data;
        this.isFileLocked = response.locked || false;
        if (this.isFileLocked) {
          this.lockMessage = 'File is currently being edited by another user';
        }
        this.initializeGridColumns(response.data[0]);
        this.rowData = this.formatGridData(response.data);
        const isDualHeader = true;
        if (isDualHeader) {
          this.pinnedTopRowData = [this.fullData[0]];
          this.fullData = this.fullData.slice(1);
          this.rowData = this.rowData.slice(1);
        }
        // Start file access polling if file is not locked
        if (!this.isFileLocked) {
          this.startFileAccessPolling();
        }
      }
    } catch (error) {
      console.error(error);
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
  getMonthText = (monthNumber: number): string => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[monthNumber - 1] || 'Unknown';
  };

  formatRowData(data: any[], headers: string[]): any[] {
    return data.map((row: any) => {
      const formatted: any = {};
      headers.forEach((key) => {
        if (key === 'DateMonthYear-Month') {
          formatted[key] = this.getMonthText(row[key]);
        } else {
          formatted[key] = this.formatValue(row[key]);
        }
      });
      return formatted;
    });
  }

  private initializeGridColumns(firstRow: any): void {
    this.columnDefs = [
      {
        headerName: '#',
        field: 'rowNum',
        pinned: 'left',
        width: 20,
        filter: false,
      },
    ];

    this.columnDefs = [
      ...this.columnDefs,
      ...Object.keys(firstRow).map((key) => {
        return {
          headerName: key,
          field: key,
          valueGetter: (params: any) => {
            const value = params.data?.[key];
            return value !== undefined && value !== null ? value : '';
          },
        };
      }),
    ];
  }

  private formatGridData(data: any[]): any[] {
    return data.map((row, index) => {
      const formattedRow: any = {
        rowNum: index + 1,
      };
      Object.keys(row).forEach((key) => {
        if (key === 'DateMonthYear-Month') {
          formattedRow[key] = this.getMonthText(row[key]);
        } else {
          formattedRow[key] = this.formatValue(row[key]);
        }
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
      return '';
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
      }
    }
    return String(value).trim();
  }

  openScanningProcess() {
    this.isScanning = true;
    const dialogRef = this.modalService.open(ScanningProcessComponent, {
      backdrop: 'static',
      size: 'md',
    });
    dialogRef.componentInstance.modalParams = {
      fileId: this.modalParams.fileId,
      file: this.fileData,
      fileName: this.fileName,
    };
    dialogRef.closed.subscribe((result) => {
      this.isScanning = false;
      if (result === 'success') {
        this.activeModal.close('success');
      } else if (result === 'step4-failed') {
        this.activeModal.close('step4-failed');
      }
    });
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

  // File lock mechanism methods
  private async removeFileAccess(): Promise<void> {
    try {
      if (this.fileData && this.fileData.file_id) {
        const response = await this.fileService
          .removeFileAcessStatus(this.fileData.file_id)
          .toPromise();
        if (
          response &&
          response.message === 'File access removed successfully'
        ) {
          console.log('File access removed successfully');
        }
      }
    } catch (error) {
      console.error('Error removing file access:', error);
    }
  }

  private startFileAccessPolling(): void {
    if (this.fileData?.locked) {
      console.log('Polling not started: file is locked.');
      return;
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.updateFileAccessStatus();
    this.pollingInterval = setInterval(() => {
      this.updateFileAccessStatus();
    }, 8000);
  }

  private async updateFileAccessStatus(): Promise<void> {
    try {
      if (this.fileData && this.fileData.file_id) {
        const response = await this.fileService
          .updateFileAcessStatus(this.fileData.file_id)
          .toPromise();
        if (response && response.message === 'File accessed successfully') {
          console.log('File access status updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating file access status:', error);
    }
  }

  get areButtonsDisabled(): boolean {
    return this.isFileLocked;
  }

  closeModal() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.activeModal.close();
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.isFileLocked === false) {
      this.removeFileAccess();
    }
  }
}
