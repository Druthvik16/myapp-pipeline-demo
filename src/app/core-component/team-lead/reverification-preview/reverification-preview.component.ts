import { Component, Input, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FileService } from 'src/app/core/service/file/file.service';
import { ShowDuplicateComponent } from '../show-duplicate/show-duplicate.component';
import { MarkModalComponent } from '../mark-modal/mark-modal.component';
import Swal from 'sweetalert2';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  SizeColumnsToContentStrategy,
} from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { ExcelFilterComponent } from '../excel-filter/excel-filter.component';
import { ListService } from 'src/app/core/service/list/list.service';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import { MasterService } from 'src/app/core/service/master/master.service';

@Component({
  selector: 'app-reverification-preview',
  standalone: false,
  templateUrl: './reverification-preview.component.html',
  styleUrl: './reverification-preview.component.scss',
})

export class ReverificationPreviewComponent {
  @Input() modalParams: any;
  fileData: any;
  headerNames: string[] = [];
  tableData: any[] = [];
  loading: boolean = false;
  standardHeaders: string[] = [];
  headerMappings: any[] = [];
  headerMapping: any = {};
  originalDataIndices: Map<any, number> = new Map();
  saveClicked: boolean = false;
  stateId: number = 0;
  dualHeaderActive = false;
  displayHeaders: string[] = [];
  fileName: string = '';
  processing: boolean = false;
  processingType: 'save' | 'reject' | 'mark-all' | 'mark-selected' | null = null;
  @ViewChild('reasonModal') reasonModal: any;
  rejectionReason: string = '';
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
    sortable: false,
    resizable: true,
    floatingFilter: false,
    suppressSizeToFit: false,
    menuTabs: ['filterMenuTab'],
    headerTooltip: (params: any) => params.colDef?.headerName || '',
  };
  public gridOptions: GridOptions = {
    context: {
      componentParent: this,
    },
    defaultColDef: this.defaultColDef,
    rowSelection: 'multiple',
    theme: 'legacy',
    suppressCellFocus: true,
    suppressRowHoverHighlight: true,
    rowHeight: 22,
    headerHeight: 24,
    rowModelType: 'clientSide',
    rowClass: 'excel-row',
    suppressHorizontalScroll: false,
    animateRows: true,
    suppressRowClickSelection: true,
    rowMultiSelectWithClick: false,
    onFilterChanged: () => {
      this.anyFilterActive = this.gridApi.isAnyFilterPresent();
    },
    onSelectionChanged: () => {
      this.onSelectionChanged();
    },
    getRowClass: this.getRowClass,
  };
  public anyFilterActive: boolean = false;
  bulkRemark: string = '';
  @ViewChild('bulkMarkModal') bulkMarkModal: any;
  markConfirmText: string = '';
  confirmationAction: 'duplicate' | 'not-duplicate' | null = null;
  @ViewChild('markConfirmModal') markConfirmModal: any;
  private bulkModalRef: any;

  //not duplicate
  public selectedRows: Set<any> = new Set();
  public allDuplicatesSelected: boolean = false;
  @ViewChild('bulkNotDuplicateModal') bulkNotDuplicateModal: any;
  public showBulkButton: boolean = false;
  reasonsLists: any = [];

  constructor(
    private activeModal: NgbActiveModal,
    private fileService: FileService,
    private modalService: NgbModal,
    private listService: ListService,
    private commonSharedService: CommonSharedService,
    private masterService: MasterService
  ) { }

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

  onSelectionChanged(): void {
    const selected = this.gridApi.getSelectedRows();
    this.showBulkButton = selected.length > 0;
  }

  async getFileData(id: any) {
    this.loading = true;
    try {
      const response = await this.fileService.getFileData(id).toPromise();
      if (response?.data?.length > 0) {
        this.fileData = response;
        if (this.fileData?.state_id !== 5) {
          this.activeModal.close('forceReload');
          this.showNotification(
            'info',
            'This file was already edited successfully.',
            'info'
          );
          return;
        }
        this.stateId = response.state_id;
        this.dualHeaderActive = this.stateId > 2;
        this.isFileLocked = response.locked || false;
        if (this.isFileLocked) {
          this.lockMessage = 'File is currently being edited by another user';
        }
        const rawData = response.data;
        const headerRow = rawData[0];
        this.initializeGridColumns(headerRow);
        const dataStartIndex = this.dualHeaderActive ? 1 : 0;
        const actualData = rawData.slice(dataStartIndex);
        this.rowData = this.formatRowData(actualData, Object.keys(headerRow));
        this.pinnedTopRowData = this.dualHeaderActive ? [headerRow] : [];
        this.mapHeaderNames(headerRow);
        if (!this.isFileLocked) {
          this.startFileAccessPolling();
        }
      }
    } catch (err) {
      this.fileData = [];
      this.rowData = [];
    } finally {
      this.loading = false;
    }
  }

  private initializeGridColumns(firstRow: any): void {
    this.columnDefs = [
      {
        headerName: '',
        field: 'select',
        pinned: 'left',
        headerCheckboxSelectionFilteredOnly: true,
        width: 50,
        minWidth: 50,
        maxWidth: 50,
        checkboxSelection: (params) => {
          const status = params.data?.status;
         return status === 'duplicate' || !status;
        },
        headerCheckboxSelection: true,
        suppressMovable: true,
        suppressSizeToFit: true,
        filter: false,
        cellClass: 'ag-cell ag-selection-checkbox',
      },
      {
        headerName: '#',
        field: 'rowNum',
        pinned: 'left',
        filter: false,
        width: 50,
        maxWidth: 60,
        suppressMovable: true,
        cellClass: 'excel-cell text-center',
        headerClass: 'excel-header text-center',
        valueGetter: (params: any) => {
          return params.node?.rowIndex != null ? params.node.rowIndex + 1 : '';
        },
      },
      ...Object.keys(firstRow).map((key) => ({
        headerName: key,
        field: key,
        filter: ExcelFilterComponent,
        cellClass: 'excel-cell',
        headerClass: 'excel-header',
        minWidth: 80,
        flex: 1,
        headerTooltip: key,
        valueGetter: (params: any) => {
          return params.data?.[key];
        },
        cellRenderer: (params: any) => {
          const div = document.createElement('div');
          div.innerHTML = params.value || '';
          div.title = params.value || '';
          div.className = 'excel-cell-renderer';
          return div;
        },
      })),
      {
        headerName: '',
        field: 'eye',
        filter: false,
        sortable: false,
        resizable: false,
        width: 40,
        minWidth: 40,
        maxWidth: 40,
        cellClass: 'excel-cell text-center',
        headerClass: 'excel-header',
        cellRenderer: (params: any) => {
          if (params.data?.status === 'duplicate') {
            const icon = document.createElement('i');
            icon.className = 'ti ti-eye pointer';
            icon.title = 'View Duplicate';
            icon.style.cursor = 'pointer';
            icon.onclick = () => this.openDuplicateData(params.data);
            return icon;
          }
          return '';
        },
      },
      {
        headerName: '',
        field: 'mark',
        filter: false,
        sortable: false,
        resizable: false,
        width: 80,
        minWidth: 80,
        maxWidth: 80,
        cellClass: 'excel-cell text-center',
        headerClass: 'excel-header',
        cellRenderer: (params: any) => {
          if (params.data?.status === 'duplicate') {
            const button = document.createElement('button');
            button.className = `btn btn-sm ${params.data._marked ? 'btn-success' : 'btn-outline-primary none'
              } excel-action-btn`;
            button.disabled = params.data._marked;
            button.innerText = params.data._marked ? 'Marked' : 'Mark';
            // button.onclick = () => {
            //   if (!params.data._marked) this.openMarkModal(params.data);
            // };
            return button;
          }
          return '';
        },
      },
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

  formatRowData(data: any[], headers: string[]): any[] {
    return data.map((row) => {
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

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api;
    setTimeout(() => {
      const colIds =
        this.gridApi.getColumns()?.map((col) => col.getColId()) || [];
      this.gridApi.autoSizeColumns(colIds, false);
    }, 100);
  }

  mapHeaderNames(displayRow: any) {
    for (let [key, value] of Object.entries(displayRow)) {
      if (value === 'Brand') this.headerMapping['Brand'] = key;
      if (value === 'Customer code') this.headerMapping['Customer code'] = key;
      if (value === 'Month') this.headerMapping['Month'] = key;
      if (value === 'Year') this.headerMapping['Year'] = key;
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

  openDuplicateData(row: any) {
    const dialogRef = this.modalService.open(ShowDuplicateComponent, {
      backdrop: 'static',
      size: 'xl',
    });
    const monthNumber = this.commonSharedService.getMonthNumber(
      row[this.headerMapping['Month']]
    );
    dialogRef.componentInstance.modalParams = {
      scanParams: {
        storeCode: row[this.headerMapping['Customer code']],
        brand: row[this.headerMapping['Brand']],
        month: monthNumber,
        year: row[this.headerMapping['Year']],
        material_style_code: row[this.headerMapping['Material Style Code']],
      },
      fileName: this.fileName,
    };
  }

  openMarkModal(row: any) {
    if (row._marked) return;
    const dialogRef = this.modalService.open(MarkModalComponent, {
      backdrop: 'static',
      size: 'sm',
      centered: true,
    });
    dialogRef.componentInstance.modalParams = { fileName: this.fileName };
    dialogRef.componentInstance.row = row;
    dialogRef.componentInstance.originalIndex = this.getOriginalIndex(row);
    dialogRef.componentInstance.headerMapping = this.headerMapping;
    dialogRef.result.then((result) => {
      if (!result) return;
      const indexInRowData = this.rowData.findIndex((r) => r === row);
      const fileDataIndex = this.dualHeaderActive
        ? indexInRowData + 1
        : indexInRowData;
      if (result.action === 'updatedInstance') {
        const updatedRow = result.updatedRow;
        if (indexInRowData !== -1) {
          this.rowData[indexInRowData]['Instance'] = updatedRow['Instance'];
          this.rowData[indexInRowData]['status'] = updatedRow['status'];
        }
        if (fileDataIndex !== -1 && fileDataIndex < this.fileData.data.length) {
          this.fileData.data[fileDataIndex]['Instance'] =
            updatedRow['Instance'];
          this.fileData.data[fileDataIndex]['status'] = updatedRow['status'];
        }
      }
      if (result?.remark !== undefined) {
        if (indexInRowData !== -1) {
          this.rowData[indexInRowData]['Remark'] = result.remark;
        }
        if (fileDataIndex !== -1 && fileDataIndex < this.fileData.data.length) {
          this.fileData.data[fileDataIndex]['Remark'] = result.remark;
        }
      }
      if (indexInRowData !== -1) {
        this.rowData[indexInRowData]['_marked'] = true;
      }
      if (fileDataIndex !== -1 && fileDataIndex < this.fileData.data.length) {
        this.fileData.data[fileDataIndex]['_marked'] = true;
      }
      this.rowData = [...this.rowData];
      if (this.gridApi) {
        this.gridApi.refreshCells();
      }
    });
  }

  private getOriginalIndex(formattedRow: any): number {
    const rowString = JSON.stringify(formattedRow);
    return this.originalDataIndices.get(rowString) ?? -1;
  }

  async save() {
    try {
      this.processing = true;
      this.processingType = 'save';
      this.fileData.state_id = 8;
      let response = await this.fileService
        .updateFileData(this.fileData)
        .toPromise();
      if (response && response.message === 'File updated successfully') {
        this.showNotification(
          'Success',
          'File updated successfully',
          'success'
        );
        this.activeModal.close('success');
      } else {
        this.saveClicked = false;
      }
      this.processing = false;
      this.processingType = null;
    } catch (error: any) {
      this.showNotification('Error', error, 'error');
    } finally {
      this.processing = false;
      this.processingType = null;
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
      this.processingType = 'reject';
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
      this.processingType = null;
    }
  }

  submitReason(modal: any) {
    if (!this.rejectionReason.trim()) {
      this.showNotification('Warning', 'Please select a rejection reason.', 'warning');
      return;
    }
    modal.close('confirmed');
  }

  get allMarked(): boolean {
    return this.rowData.every(
      (row) => row.status !== 'duplicate' || row._marked
    );
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

  //new bulk modal
  openBulkRemarkModal() {
    this.bulkRemark = '';
    this.bulkModalRef = this.modalService.open(this.bulkMarkModal, {
      backdrop: 'static',
      size: 'sm',
      centered: true,
    });
  }

  openMarkConfirmationModal(action: 'duplicate' | 'not-duplicate') {
    if (!this.bulkRemark.trim()) {
      this.showNotification('Warning', 'Please enter a remark.', 'warning');
      return;
    }
    this.confirmationAction = action;
    this.markConfirmText = '';
    const modalRef = this.modalService.open(this.markConfirmModal, {
      backdrop: 'static',
      size: 'md',
      centered: true,
    });
    modalRef.result
      .then((res) => {
        if (res === 'confirmed') {
          modalRef.close();
          setTimeout(() => {
            if (this.bulkModalRef) {
              this.bulkModalRef.close();
            }
            this.processBulkMarking();
          });
        }
      })
      .catch(() => {
      });
  }


  submitMarkConfirmation(modal: any) {
    if (this.markConfirmText.trim() !== 'confirm') {
      this.showNotification(
        'Warning',
        'Please type "confirm" to proceed.',
        'warning'
      );
      return;
    }
    modal.close('confirmed');
  }


  closeMarkConfirmModal(modal: any) {
    modal.dismiss('user-cancelled');
  }

  async processBulkMarking() {
    const markAs = this.confirmationAction;
    const remark = this.bulkRemark.trim();
    this.processing = true;
    this.processingType = 'mark-all';
    let successCount = 0;
    let errorCount = 0;
    try {
      const apiCache = new Map<string, any>();
      const BATCH_SIZE = 20;
      let processedCount = 0;

      for (let i = 0; i < this.rowData.length; i++) {
        const row = this.rowData[i];
        if (row.status === 'duplicate' && !row._marked) {
          const indexInRowData = i;
          const fileDataIndex = this.dualHeaderActive
            ? indexInRowData + 1
            : indexInRowData;

          try {
            if (markAs === 'duplicate') {
              row._marked = true;
              row.Remark = remark;
              if (
                fileDataIndex !== -1 &&
                fileDataIndex < this.fileData.data.length
              ) {
                this.fileData.data[fileDataIndex]._marked = true;
                this.fileData.data[fileDataIndex].Remark = remark;
              }
              successCount++;
            } else if (markAs === 'not-duplicate') {
              const monthNumber = this.commonSharedService.getMonthNumber(
                row[this.headerMapping['Month']]
              );
              const cacheKey = `${row[this.headerMapping['Customer code']]}_${row[this.headerMapping['Brand']]
                }_${row[this.headerMapping['Month']]}_${row[this.headerMapping['Year']]
                }`;
              let maxInstance = 0;
              if (apiCache.has(cacheKey)) {
                maxInstance = apiCache.get(cacheKey);
              } else {
                const filter = {
                  store_code: row[this.headerMapping['Customer code']],
                  brand: row[this.headerMapping['Brand']],
                  month: monthNumber,
                  year: row[this.headerMapping['Year']],
                };
                const response = await this.listService
                  .getDataList(filter)
                  .toPromise();
                if (response) {
                  const validInstances = response
                    .map((r: any) => Number(r.instance))
                    .filter((val: any) => !isNaN(val) && val >= 0);
                    console.log('Valid Instances:', validInstances);
                  maxInstance = validInstances.length
                    ? Math.max(...validInstances)
                    : 0;
                    console.log('Max Instance from API:', maxInstance);
                  apiCache.set(cacheKey, maxInstance);
                }
              }
              const newInstance = maxInstance + 1;
              console.log('New Instance assigned:', newInstance);
              row['Instance'] = newInstance;
               console.log('New Instance assigned:', newInstance);
              row['status'] = 'not-duplicate';
              row._marked = true;
              row.Remark = remark;

              if (
                fileDataIndex !== -1 &&
                fileDataIndex < this.fileData.data.length
              ) {
                const fileRow = this.fileData.data[fileDataIndex];
                fileRow['Instance'] = newInstance;
                fileRow['status'] = 'not-duplicate';
                fileRow['_marked'] = true;
                fileRow['Remark'] = remark;
                console.log('FileRow Instance:', fileRow['Instance']);
              }
              successCount++;
            }

            processedCount++;
            if (processedCount % BATCH_SIZE === 0) {
              this.gridApi?.refreshCells({ force: true });
            }
          } catch {
            errorCount++;
          }
        }
      }
        this.rowData = [...this.rowData];
        this.gridApi?.refreshCells();
        this.anyFilterActive = false;
      this.anyFilterActive = false;
      if (errorCount === 0 && successCount > 0) {
        this.showNotification(
          'Success',
          `Successfully marked ${successCount} rows as ${markAs === 'duplicate' ? 'duplicate' : 'not duplicate'
          }.`,
          'success'
        );
      } else if (successCount > 0 && errorCount > 0) {
        this.showNotification(
          'Warning',
          `Marked ${successCount} rows successfully, ${errorCount} failed.`,
          'warning'
        );
      } else if (successCount === 0 && errorCount === 0) {
        this.showNotification('Info', 'No rows were processed.', 'info');
      }
    } catch (error: any) {
      if (error !== 'user-cancelled') {
        this.showNotification(
          'Error',
          'Failed to mark rows: ' + (error.message || error),
          'error'
        );
      }
    } finally {
      this.processing = false;
      this.processingType = null;
    }
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



  openBulkNotDuplicateModal(): void {
    const selectedRows = this.gridApi.getSelectedRows();
    if (selectedRows.length === 0) {
      this.showNotification('Warning', 'Please select at least one row.', 'warning');
      return;
    }
    this.modalService.open(this.bulkNotDuplicateModal, {
      backdrop: 'static',
      size: 'md',
      centered: true,
      scrollable: true
    });
  }

  async submitBulkNotDuplicate(modal: any): Promise<void> {
    if (!this.bulkRemark.trim()) {
      this.showNotification('Warning', 'Please enter a remark.', 'warning');
      return;
    }

    modal.close();
    this.processing = true;
    this.processingType = 'mark-selected';

    try {
      const apiCache = new Map<string, any>();
      let successCount = 0;
      let errorCount = 0;
      const remark = this.bulkRemark.trim();
      const selectedRows = this.gridApi.getSelectedRows();
      for (const row of selectedRows) {
        try {
          const indexInRowData = this.rowData.findIndex((r) => r === row);
          const fileDataIndex = this.dualHeaderActive ? indexInRowData + 1 : indexInRowData;

          const monthNumber = this.commonSharedService.getMonthNumber(
            row[this.headerMapping['Month']]
          );
          const cacheKey = `${row[this.headerMapping['Customer code']]}_${row[this.headerMapping['Brand']]}_${row[this.headerMapping['Month']]}_${row[this.headerMapping['Year']]}`;
          let maxInstance = apiCache.get(cacheKey) ?? 0;
          if (!apiCache.has(cacheKey)) {
            const filter = {
              store_code: row[this.headerMapping['Customer code']],
              brand: row[this.headerMapping['Brand']],
              month: monthNumber,
              year: row[this.headerMapping['Year']],
            };
            const response = await this.listService.getDataList(filter).toPromise();
            if (response) {
              const validInstances = response
                .map((r: any) => Number(r.instance))
                .filter((val: any) => !isNaN(val) && val >= 0);
              maxInstance = validInstances.length ? Math.max(...validInstances) : 0;
              apiCache.set(cacheKey, maxInstance);
            }
          }
          const newInstance = maxInstance + 1;
          row['Instance'] = newInstance;
          row['status'] = 'not-duplicate';
          row['_marked'] = true;
          row['Remark'] = remark;
          if (fileDataIndex !== -1 && fileDataIndex < this.fileData.data.length) {
            const fileRow = this.fileData.data[fileDataIndex];
            fileRow['Instance'] = newInstance;
            fileRow['status'] = 'not-duplicate';
            fileRow['_marked'] = true;
            fileRow['Remark'] = remark;
          }
          successCount++;
        } catch (err) {
          console.error('Row update failed:', err);
          errorCount++;
        }
      }
      this.rowData = [...this.rowData]
      this.gridApi.refreshCells({ force: true });
      this.gridApi.deselectAll();
      if (successCount > 0) {
        this.showNotification(
          'Success',
          `Successfully marked ${successCount} row(s) as not duplicate.`,
          'success'
        );
      } else if (errorCount > 0) {
        this.showNotification('Warning', `${errorCount} rows failed.`, 'warning');
      }
    } catch (error: any) {
      this.showNotification('Error', 'Failed to mark rows: ' + (error.message || error), 'error');
    } finally {
      this.processing = false;
      this.processingType = null;
    }
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



  get selectedRowCount(): number {
    return this.gridApi ? this.gridApi.getSelectedRows().length : 0;
  }

}
