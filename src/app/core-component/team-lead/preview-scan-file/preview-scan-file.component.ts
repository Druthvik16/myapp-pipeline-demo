import {
  Component,
  ElementRef,
  Input,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  SizeColumnsToContentStrategy,
} from 'ag-grid-community';
import { FileService } from 'src/app/core/service/file/file.service';
import Swal from 'sweetalert2';
import { ExcelFilterComponent } from '../excel-filter/excel-filter.component';
import { MasterService } from 'src/app/core/service/master/master.service';

@Component({
  selector: 'app-preview-scan-file',
  standalone: false,
  templateUrl: './preview-scan-file.component.html',
  styleUrl: './preview-scan-file.component.scss',
})
export class PreviewScanFileComponent {
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
  processingSource: 'approve' | 'reject' | null = null;
  @ViewChild('reasonModal') reasonModal: any;
  rejectionReason: string = '';
  processing: boolean = false;
  fullData: any[] = [];
  rowHeight = 40;
  viewportHeight = 600;
  buffer = 50;
  scrollContainer!: HTMLElement;
  alreadyLoadedUntil = 0;
  // File lock mechanism properties
  private pollingInterval: any;
  isFileLocked: boolean = false;
  lockMessage: string = '';

  @ViewChild('agGrid') agGrid!: AgGridAngular;
  autoSizeStrategy: SizeColumnsToContentStrategy = {
    type: 'fitCellContents',
    defaultMaxWidth: 200,
    defaultMinWidth: 50,
    columnLimits: [
      {
        colId: 'rowNum',
        maxWidth: 35,
        minWidth: 35,
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
  public columnApi!: any;
  public columnDefs: ColDef[] = [];
  public rowData: any[] = [];
  public pinnedTopRowData: any[] = [];

  public defaultColDef: any = {
    filter: ExcelFilterComponent,
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
    onFilterChanged: () => {
      this.anyFilterActive = this.gridApi.isAnyFilterPresent();
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
    getRowClass: this.getRowClass,
  };
  public anyFilterActive: boolean = false;
  reasonsLists: any = [];

  constructor(
    private activeModal: NgbActiveModal,
    private fileService: FileService,
    private renderer: Renderer2,
    private elRef: ElementRef,
    private modalService: NgbModal,
    private masterService: MasterService
  ) {}

  ngOnInit() {
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
        if (this.fileData?.state_id !== 3) {
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

  createColumnDefs(headerRow: any): ColDef[] {
    return Object.keys(headerRow).map((key) => ({
      headerName: key,
      field: key,
      filter: ExcelFilterComponent,
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

  processAllRowsAsData(response: any) {
    if (response.data && response.data.length > 0) {
      const data = response.data;
      const dualHeaderActive = response.state_id > 2;
      const headerRow = data[0];
      this.headerNames = Object.keys(headerRow);
      this.displayHeaders = Object.values(headerRow);
      const dataStartIndex = dualHeaderActive ? 1 : 0;
      this.fullData = data.slice(dataStartIndex).map((row: any) => {
        const formattedRow: any = {};
        this.headerNames.forEach((key) => {
          formattedRow[key] = this.formatValue(row[key]);
        });
        return formattedRow;
      });
      this.loadInitialChunk();
    }
  }

  loadInitialChunk() {
    const rowsPerViewport = Math.ceil(this.viewportHeight / this.rowHeight);
    const chunk = this.fullData.slice(0, rowsPerViewport + this.buffer);
    this.tableData = [...chunk];
    this.alreadyLoadedUntil = this.tableData.length;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.scrollContainer =
        this.elRef.nativeElement.querySelector('.table-responsive');
      if (this.scrollContainer) {
        this.viewportHeight = this.scrollContainer.clientHeight;
        this.renderer.listen(
          this.scrollContainer,
          'scroll',
          this.onScroll.bind(this)
        );
      }
    });
  }

  onScroll() {
    const scrollTop = this.scrollContainer.scrollTop;
    const scrollHeight = this.scrollContainer.scrollHeight;
    const clientHeight = this.scrollContainer.clientHeight;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      this.appendMoreRows();
    }
  }

  appendMoreRows() {
    const nextChunkSize = this.buffer;
    const nextChunk = this.fullData.slice(
      this.alreadyLoadedUntil,
      this.alreadyLoadedUntil + nextChunkSize
    );
    if (nextChunk.length > 0) {
      this.tableData = [...this.tableData, ...nextChunk];
      this.alreadyLoadedUntil += nextChunk.length;
    }
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

  async approveData() {
    try {
      this.processing = true;
      this.processingSource = 'approve';
      this.fileData.state_id = 4;
      const payload = {
        file_id: this.fileData.file_id,
        state_id: this.fileData.state_id,
        status_id: this.fileData.status_id,
      };
      let response = await this.fileService
        .updateFileStatus(payload)
        .toPromise();
      if (response && response.message === 'File updated successfully') {
        this.activeModal.close('success');
        this.showNotification(
          'Success',
          'File Updated successfully',
          'success'
        );
      }
    } catch (error: any) {
      this.showNotification('Error', error, 'error');
    } finally {
      this.processing = false;
      this.processingSource = null;
    }
  }

  async rejectFile() {
    this.rejectionReason = '';
    await this.getReasons();
    const modalRef = this.modalService.open(this.reasonModal, {
      backdrop: 'static',
      size: 'md',
      centered: true,
    });

    try {
      const result = await modalRef.result;
      if (result !== 'confirmed') return;
      this.processing = true;
      this.processingSource = 'reject';
      this.fileData.state_id = 7;
      const payload = {
        file_id: this.fileData.file_id,
        state_id: this.fileData.state_id,
        status_id: this.fileData.status_id,
        rejectReason: this.rejectionReason.replace(/\n/g, ' ').trim(),
      };
      let response = await this.fileService
        .updateFileStatus(payload)
        .toPromise();
      if (response && response.message === 'File updated successfully') {
        this.activeModal.close('success');
        this.showNotification(
          'Success',
          'File Updated successfully',
          'success'
        );
      }
    } catch (error: any) {
      if (error !== 'user-cancelled') {
        this.showNotification('Error', error, 'error');
      }
    } finally {
      this.processing = false;
      this.processingSource = null;
    }
  }

  submitReason(modal: any) {
    if (!this.rejectionReason.trim()) {
      this.showNotification('Warning', 'Please select a rejection reason.', 'warning');
      return;
    }
    modal.close('confirmed');
  }

  clearAllFilters(): void {
    if (!this.gridApi) return;
    this.gridApi.setFilterModel(null);
    this.gridApi.getColumnDefs()?.forEach((colDef: any) => {
      if (colDef.field && colDef.filter === ExcelFilterComponent) {
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
    return this.isFileLocked || this.processing;
  }

  async getReasons() {
    try {
      let response = await this.masterService.getRejectList().toPromise();
      if (response.status === 200 && response.message === "success") {
        this.reasonsLists = response.data;
      }
    } catch (error) {
      this.reasonsLists = [];
    }
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
