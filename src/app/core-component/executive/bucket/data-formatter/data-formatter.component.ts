import { Component, Input, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import {
  CellValueChangedEvent,
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { FileService } from 'src/app/core/service/file/file.service';
import Swal from 'sweetalert2';
import { ExcelStyleFilterComponent } from '../excel-style-filter/excel-style-filter.component';
import { StoreService } from 'src/app/core/service/store/store.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MasterService } from 'src/app/core/service/master/master.service';
import { ProductService } from 'src/app/core/service/product/product.service';

@Component({
  selector: 'app-data-formatter',
  standalone: false,
  templateUrl: './data-formatter.component.html',
  styleUrl: './data-formatter.component.scss',
})
export class DataFormatterComponent {
  @Input() modalParams: any;
  fileData: any;
  headerNames: string[] = [];
  loading: boolean = false;
  selectedMonth: Date | null | undefined;
  selectedYear: Date | null | undefined;
  monthPickerConfig!: Partial<BsDatepickerConfig>;
  yearPickerConfig!: Partial<BsDatepickerConfig>;
  selectedMonthNumber: number | null = null;
  selectedYearNumber: number | null = null;
  saveClicked!: boolean;
  saveRejectedClicked!: boolean;
  fileName: string = '';
  @ViewChild('reasonModal') reasonModal: any;
  rejectionReason: string = '';
  processing: boolean = false;
  processingType: 'save' | 'reject' | 'validate' | null = null;
  @ViewChild('agGrid') agGrid!: AgGridAngular;
  defaultColDef: any = {
    filter: ExcelStyleFilterComponent,
    cellClass: 'excel-cell',
    headerClass: 'excel-header',
    minWidth: 50,
    flex: 1,
    cellClassRules: {},
    cellStyle: undefined,
  };
  public gridOptions: GridOptions = {
    context: {
      componentParent: this,
    },
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter: false,
      suppressSizeToFit: false,
      cellClass: 'excel-cell',
      headerClass: 'excel-header',
      menuTabs: ['filterMenuTab'],
      autoHeight: true,
      wrapText: true,
    },
    onCellValueChanged: (params: CellValueChangedEvent) => {
      if (params.colDef.field) {
        const rowIndex = params.node.rowIndex;
        if (rowIndex !== null && this.fileData?.data[rowIndex]) {
          this.fileData.data[rowIndex][params.colDef.field] = params.newValue;
        }
        window.dispatchEvent(
          new CustomEvent('dataRefresh', {
            detail: {
              columnField: params.colDef.field,
              action: 'cellEdit',
              rowIndex: rowIndex,
              oldValue: params.oldValue,
              newValue: params.newValue,
            },
          })
        );
      }
    },
    rowSelection: 'multiple',
    theme: 'legacy',
    suppressCellFocus: true,
    rowHeight: 22,
    headerHeight: 24,
    animateRows: true,
    rowModelType: 'clientSide',
    suppressRowHoverHighlight: true,
    suppressRowClickSelection: true,
    rowClass: 'excel-row',
    suppressHorizontalScroll: false,
    suppressColumnVirtualisation: true,
    onFilterChanged: () => {
      this.evaluateMapperEnabling();
      this.anyFilterActive = this.gridApi.isAnyFilterPresent();
    },
    onSelectionChanged: () => {
      this.onSelectionChanged();
    },
    getRowStyle: (params) => {
      if (params.node.isSelected()) {
        return { backgroundColor: 'transparent' };
      }
      return params.node.rowIndex! % 2 === 0
        ? { backgroundColor: '#ffffff' }
        : { backgroundColor: '#f8f9fa' };
    },
    getRowClass: (params) => {
      if (params.data?.ISEANValidated === 'NO') {
        return 'ean-validation-failed';
      }
      return '';
    },
  };
  public columnDefs: ColDef[] = [];
  public rowData: any[] = [];
  public gridApi!: GridApi;
  public columnApi: any;
  headerKeys: any = [];
  showUpdateMapperButton: boolean = false;
  updateMapperEnabled: boolean = false;
  @ViewChild('replaceModal') replaceModal: any;
  columnHeaders: string[] = [];
  brandOptions: any[] = [];
  selectedCustomerCode: string = '';
  replaceForm!: FormGroup;
  isReplaceFormValid: boolean = true;
  public anyFilterActive: boolean = false;
  masterFileData: any[] = [];
  private pollingInterval: any;
  isFileLocked: boolean = false;
  lockMessage: string = '';
  userData: any;
  reasonsLists: any = [];

  isEANValidated!: boolean;
  eanValidateForm!: FormGroup;
  isEanValidateFormValid: boolean = true;
  isEanValidationDisabled: boolean = true;
  @ViewChild('eanValidateModal') eanValidateModal: any;
  clientUUID: any;

  constructor(
    private activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private fileService: FileService,
    private storeService: StoreService,
    private formBuilder: FormBuilder,
    private masterService: MasterService,
    private productService: ProductService
  ) { }

  ngOnInit() {
    this.userData = JSON.parse(sessionStorage.getItem('LOGINUSER') || '{}');
    this.saveClicked = false;
    this.saveRejectedClicked = false;
    this.monthPickerConfig = {
      minMode: 'month',
      dateInputFormat: 'MMMM',
      showWeekNumbers: false,
      containerClass: 'theme-default',
      minDate: new Date(2025, 3, 1), // April 2025 (month is 0-indexed, so 3 = April)
    };
    this.yearPickerConfig = {
      minMode: 'year',
      dateInputFormat: 'YYYY',
      showWeekNumbers: false,
      containerClass: 'theme-default',
      minDate: new Date(2025, 3, 1), // April 2025 (month is 0-indexed, so 3 = April)
    };
    this.fileName = this.modalParams.fileName;
    this.clientUUID = this.modalParams.clientUUID;
    this.getFileData(this.modalParams.file);
    this.replaceForm = this.formBuilder.group({
      brandColumn: ['', Validators.required],
      brandValue: ['', Validators.required],
    });
    this.eanValidateForm = this.formBuilder.group({
      brandColumn: ['', Validators.required],
      eanColumn: ['', Validators.required],
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

  showNotificationForEdited(
    header: string,
    message: string,
    labelicon: any,
    onOkClick?: () => void
  ) {
    Swal.fire({
      title: header,
      text: message,
      icon: labelicon,
      confirmButtonColor: '#364574',
      confirmButtonText: 'OK',
    }).then((result) => {
      if (result.isConfirmed && onOkClick) {
        onOkClick();
      }
    });
  }

  async getStoreCodeHeaderKeys() {
    try {
      const response = await this.storeService
        .getStoreCodeHeaderKeys()
        .toPromise();
      if (response) {
        this.headerKeys = response;
      }
    } catch (error) {
      console.error(error);
    }
  }

  async getFileData(id: any) {
    this.loading = true;
    try {
      const response = await this.fileService.getFileData(id).toPromise();
      if (response && response.data?.length > 0) {
        this.fileData = response;
        if (this.fileData?.state_id !== 1) {
          this.activeModal.close('forceReload');
          this.showNotification(
            'info',
            'This file was already edited successfully.',
            'info'
          );
          return;
        }
        this.masterFileData = this.fileData.data;
        this.isFileLocked = response.locked || false;
        this.isEANValidated = this.fileData.isEanValidated;
        if (this.isFileLocked) {
          this.lockMessage = 'File is currently being edited by another user';
        }
        this.initializeGridColumns(response.data[0]);
        this.rowData = this.formatGridData(response.data);
        await this.getStoreCodeHeaderKeys();
        this.evaluateHeaderKeyMapping();
        this.checkEanValidationStatus();
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

  evaluateHeaderKeyMapping(): void {
    const uploadedHeaders = this.columnDefs.map((col) =>
      col.headerName?.toLowerCase().trim()
    );
    const mappedKeys = (this.headerKeys?.key_map || []).map((k: string) =>
      k.toLowerCase().trim()
    );
    this.showUpdateMapperButton = uploadedHeaders.some((h) =>
      mappedKeys.includes(h)
    );
    if (this.showUpdateMapperButton) {
      this.evaluateMapperEnabling();
    }
  }

  evaluateMapperEnabling(): void {
    this.updateMapperEnabled = false;
    const mappedKeys = (this.headerKeys?.key_map || []).map((k: any) =>
      k.toLowerCase().trim()
    );
    const matchingCol = this.columnDefs.find((col) =>
      mappedKeys.includes(col.headerName?.toLowerCase().trim() || '')
    );
    if (!matchingCol || !matchingCol.field) return;
    const field = matchingCol.field;
    const valueSet = new Set<string>();
    this.gridApi?.forEachNodeAfterFilterAndSort((node) => {
      let val = node.data?.[field];
      if (val === null || val === undefined || val === '') {
        val = '__BLANK__';
      }
      valueSet.add(val);
    });

    this.updateMapperEnabled =
      valueSet.size === 1 && !valueSet.has('__BLANK__');
  }

  updateCustomerCodeButtonState(): void {
    const field = this.getCustomerCodeColumn();
    if (!field || !this.gridApi) {
      this.updateMapperEnabled = false;
      return;
    }
    const valueSet = new Set<string>();
    this.gridApi.forEachNodeAfterFilterAndSort((node) => {
      let val = node.data?.[field];
      if (val === null || val === undefined || val === '') val = '__BLANK__';
      valueSet.add(val);
    });

    this.updateMapperEnabled =
      valueSet.size === 1 && !valueSet.has('__BLANK__');
  }

  private initializeGridColumns(firstRow: any): void {
    this.columnDefs = [];
    if (this.userData?.user?.user_type != 'Team Lead') {
      this.columnDefs.push({
        headerName: '',
        field: '',
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        pinned: 'left',
        width: 50,
        minWidth: 50,
        maxWidth: 50,
        suppressSizeToFit: true,
        filter: false,
        cellClass: 'ag-cell ag-selection-checkbox',
        suppressMovable: true,
      });
    }
    this.columnDefs.push({
      headerName: '#',
      field: 'rowNum',
      pinned: 'left',
      width: 20,
      filter: false,
      valueGetter: (params: any) => params.data?.rowNum ?? '',
    });
    this.columnDefs.push(
      ...Object.keys(firstRow)
        .filter((key) => key !== 'rowNum' && key !== 'action')
        .map((key) => ({
          headerName: key,
          field: key,
          valueGetter: (params: any) => params.data?.[key],
        }))
    );
    if (this.userData?.user?.user_type != 'Team Lead') {
      this.columnDefs.push({
        headerName: 'Action',
        field: 'action',
        filter: false,
        sortable: false,
        resizable: false,
        width: 80,
        minWidth: 80,
        maxWidth: 80,
        cellClass: 'excel-cell excel-action-cell',
        headerClass: 'excel-header',
        cellRenderer: (params: any) => {
          const button = document.createElement('button');
          button.innerHTML = '<i class="fa fa-trash"></i>';
          button.classList.add(
            'btn',
            'btn-danger',
            'btn-sm',
            'excel-action-btn'
          );
          button.title = 'Delete row';
          button.addEventListener('click', () => {
            this.deleteRow(params.node.rowIndex);
          });
          return button;
        },
      });
    }
  }

  formatGridData(data: any[]): any[] {
    return data.map((row, idx) => {
      const formattedRow: any = {
        rowNum: idx + 1,
      };
      for (const key in row) {
        if (key === 'rowNum') continue;
        formattedRow[key] = this.formatValue(row[key]);
      }
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
      this.evaluateMapperEnabling();
      this.checkEanValidationStatus();
    }, 100);
    this.gridApi.addEventListener('filterChanged', () => {
      this.updateCustomerCodeButtonState();
    });
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return value;
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

  deleteRow(index: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this row?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#364574',
      cancelButtonColor: 'rgb(243, 78, 78)',
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        const node = this.gridApi.getDisplayedRowAtIndex(index);
        if (!node) return;
        const rowData = node.data;
        const rowNumToDelete = rowData.rowNum;
        this.fileData.data = this.fileData.data.map((row: any, idx: any) => ({
          ...row,
          rowNum: idx + 1,
        }));
        this.fileData.data = this.fileData.data.filter(
          (item: any) => item.rowNum !== rowNumToDelete
        );
        this.fileData.data = this.fileData.data.map(
          (row: any, idx: number) => ({
            ...row,
            rowNum: idx + 1,
          })
        );
        this.rowData = this.formatGridData(this.fileData.data);
        this.gridApi.setGridOption('rowData', this.rowData);
        this.evaluateMapperEnabling();
        this.checkEanValidationStatus();
        window.dispatchEvent(
          new CustomEvent('dataRefresh', {
            detail: { action: 'delete', affectedRowNum: rowNumToDelete },
          })
        );
        this.showNotification('Deleted', 'Row has been removed', 'success');
      }
    });
  }

  onMonthOrYearChange() {
    if (!this.selectedMonth || isNaN(new Date(this.selectedMonth).getTime())) {
      this.selectedMonthNumber = null;
    } else {
      const date = new Date(this.selectedMonth);
      this.selectedMonthNumber = date.getMonth() + 1;
    }
    if (!this.selectedYear || isNaN(new Date(this.selectedYear).getTime())) {
      this.selectedYearNumber = null;
    } else {
      const date = new Date(this.selectedYear);
      this.selectedYearNumber = date.getFullYear();
    }
  }

  clearMonth(): void {
    this.selectedMonth = null;
    this.onMonthOrYearChange();
  }

  clearYear(): void {
    this.selectedYear = null;
    this.onMonthOrYearChange();
  }

  async saveData() {
    if (!this.selectedMonthNumber && !this.selectedYearNumber) {
      this.showNotification(
        'Error',
        'Please select both month and year',
        'error'
      );
      return;
    }
    if (!this.selectedMonthNumber) {
      this.showNotification('Error', 'Please select month', 'error');
      return;
    }
    if (!this.selectedYearNumber) {
      this.showNotification('Error', 'Please select year', 'error');
      return;
    }
    this.processing = true;
    this.processingType = 'save';
    try {
      this.fileData.data = this.fileData.data.map((row: any) => {
        const { rowNum, ...rest } = row;
        return {
          ...rest,
          'DateMonthYear-Month': this.selectedMonthNumber,
          'DateMonthYear-Year': this.selectedYearNumber,
          Instance: 1,
          Remark: '',
        };
      });
      this.fileData.state_id = 2;
      let response = await this.fileService
        .updateFileData(this.fileData)
        .toPromise();
      if (response && response.message === 'File updated successfully') {
        this.showNotification(
          'Success',
          'File Updated successfully',
          'success'
        );
        this.activeModal.close('success');
      } else {
        this.showNotification('Error', response.message, 'error');
      }
    } catch (error: any) {
      this.processing = false;
      this.processingType = null;
      this.showNotification('Error', error, 'error');
    } finally {
      this.processing = false;
      this.processingType = null;
    }
  }

  async rejectData() {
    this.rejectionReason = '';
    await this.getReasons();
    const modalRef = this.modalService.open(this.reasonModal, {
      backdrop: 'static',
      size: 'md',
      centered: true,
    });
    this.processing = true;
    this.processingType = 'reject';
    try {
      const result = await modalRef.result;
      if (result !== 'confirmed') return;
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
      } else {
        this.showNotification('Error', response.message, 'error');
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

  deleteSelectedRows(): void {
    const selectedNodes = this.gridApi?.getSelectedNodes();
    if (!selectedNodes || selectedNodes.length === 0) {
      this.showNotification(
        'No Selection',
        'Please select rows to delete',
        'warning'
      );
      return;
    }
    Swal.fire({
      title: 'Are you sure?',
      text: `Delete ${selectedNodes.length} selected row(s)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#364574',
      cancelButtonColor: 'rgb(243, 78, 78)',
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.fileData.data = this.fileData.data.map((row: any, idx: any) => ({
        ...row,
        rowNum: idx + 1,
      }));
      const deletedRowNums: number[] = selectedNodes.map(
        (node) => node.data.rowNum
      );
      this.fileData.data = this.fileData.data.filter(
        (row: any) => !deletedRowNums.includes(row.rowNum)
      );
      this.fileData.data = this.fileData.data.map((row: any, idx: number) => ({
        ...row,
        rowNum: idx + 1,
      }));
      this.rowData = this.formatGridData(this.fileData.data);
      this.gridApi.setGridOption('rowData', this.fileData.data);
      this.evaluateMapperEnabling();
      this.checkEanValidationStatus();
      window.dispatchEvent(
        new CustomEvent('dataRefresh', {
          detail: { action: 'deleteMultiple', affectedRows: deletedRowNums },
        })
      );
      this.showNotification(
        'Deleted',
        `${selectedNodes.length} row(s) removed`,
        'success'
      );
    });
  }

  onSelectionChanged(): void { }

  get isDeleteDisabled(): boolean {
    const selectedRows = this.gridApi?.getSelectedRows();
    return !selectedRows || selectedRows.length === 0;
  }

  onMapperFilterChanged(field: string, selectedValues: string[]): void {
    const keyMap = (this.headerKeys?.key_map || []).map((k: string) =>
      k.toLowerCase().trim()
    );
    if (!keyMap.includes(field.toLowerCase().trim())) return;
    this.updateMapperEnabled =
      selectedValues.length === 1 && selectedValues[0] !== '__BLANK__';
  }

  async openReplaceModal() {
    this.replaceForm.reset({
      brandColumn: '',
      brandValue: '',
    });
    this.isReplaceFormValid = true;
    this.columnHeaders = this.columnDefs
      .filter(
        (col: any) =>
          col.field && col.field !== 'rowNum' && col.field !== 'action'
      )
      .map((col: any) => col.headerName);
    const field = this.getCustomerCodeColumn();
    if (!field) return;
    const valueSet = new Set<string>();
    this.gridApi?.forEachNodeAfterFilterAndSort((node) => {
      let val = node.data?.[field];
      if (val === null || val === undefined || val === '') val = '__BLANK__';
      valueSet.add(val);
    });
    if (valueSet.size !== 1) {
      Swal.fire(
        'Error',
        'Please filter a single customer code before proceeding.',
        'error'
      );
      return;
    }
    const selectedCustomerCode = [...valueSet][0];
    await this.loadBrandOptions(selectedCustomerCode);
    const modalRef = this.modalService.open(this.replaceModal, {
      backdrop: 'static',
      size: 'md',
    });
    try {
      const result = await modalRef.result;
      if (result !== 'confirmed') return;
    } catch (error: any) {
      if (error !== 'user-cancelled') {
        this.showNotification('Error', error, 'error');
      }
    }
  }

  getFilteredCustomerCode(): string | null {
    const customerCodeField = this.getCustomerCodeColumn();
    if (!customerCodeField) return null;
    const visibleValues = new Set<string>();
    this.gridApi.forEachNodeAfterFilter((node) => {
      const rawValue = node.data?.[customerCodeField];
      const trimmedValue = rawValue?.toString().trim();
      if (trimmedValue) {
        visibleValues.add(trimmedValue);
      }
    });
    return visibleValues.size === 1 ? [...visibleValues][0] : null;
  }

  getCustomerCodeColumn(): string | undefined {
    const directMatch = this.columnDefs.find(
      (col) => col.headerName?.toLowerCase().trim() === 'customer code'
    );
    if (directMatch?.field) return directMatch.field;
    const lowerMapped = (this.headerKeys?.key_map || []).map((k: string) =>
      k.toLowerCase().trim()
    );
    const match = this.columnDefs.find(
      (col) =>
        col.headerName &&
        lowerMapped.includes(col.headerName.toLowerCase().trim())
    );
    return match?.field;
  }

  async loadBrandOptions(customerCode: string) {
    try {
      const response = await this.storeService
        .getStoreBrands(customerCode)
        .toPromise();
      if (response && Array.isArray(response)) {
        this.brandOptions = [
          ...response.map((value) => ({ id: value, name: value })),
        ];
      } else {
        this.brandOptions = [{ id: '', name: 'Select Brand' }];
      }
    } catch (error) {
      this.brandOptions = [];
      this.brandOptions.unshift({ id: '', name: 'Select Brand' });
    }
  }

  submitReplaceForm(modal: any) {
    this.isReplaceFormValid = true;
    if (this.replaceForm.invalid) {
      this.isReplaceFormValid = false;
      this.replaceForm.markAllAsTouched();
      return;
    }
    const selectedColumn = this.replaceForm.value.brandColumn;
    const replacementValue = this.replaceForm.value.brandValue;
    const customerCode = this.getFilteredCustomerCode();
    const customerCodeField = this.getCustomerCodeColumn();
    if (
      !selectedColumn ||
      !replacementValue ||
      !customerCode ||
      !customerCodeField
    ) {
      this.showNotification('Error', 'Invalid input', 'error');
      return;
    }
    this.fileData.data = this.fileData.data.map((row: any, idx: number) => ({
      ...row,
      rowNum: idx + 1,
    }));
    const affectedRowIndexes: number[] = [];
    this.gridApi.forEachNodeAfterFilterAndSort((node) => {
      const row = node.data;
      const codeVal = row?.[customerCodeField];
      if (codeVal?.toString().trim() === customerCode.toString().trim()) {
        const rowNum = row.rowNum;
        const dataRow = this.fileData.data.find(
          (r: any) => r.rowNum === rowNum
        );
        if (dataRow) {
          dataRow[selectedColumn] = replacementValue;
          affectedRowIndexes.push(rowNum);
        }
      }
    });
    this.fileData.data = this.fileData.data.map((row: any, idx: number) => ({
      ...row,
      rowNum: idx + 1,
    }));
    this.rowData = this.formatGridData(this.fileData.data);
    this.gridApi.setGridOption('rowData', this.rowData);
    window.dispatchEvent(
      new CustomEvent('dataRefresh', {
        detail: {
          action: 'bulkEdit',
          columnField: selectedColumn,
          affectedRows: affectedRowIndexes,
          newValue: replacementValue,
          filterField: customerCodeField,
          filterValue: customerCode,
        },
      })
    );
    modal.close('confirmed');
  }

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

  submitReason(modal: any) {
    if (!this.rejectionReason.trim()) {
      this.showNotification(
        'Warning',
        'Please select a rejection reason.',
        'warning'
      );
      return;
    }
    modal.close('confirmed');
  }

  closeModal() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.activeModal.close();
  }

  onModelUpdated(): void {
    this.evaluateMapperEnabling();
  }

  async getReasons() {
    try {
      let response = await this.masterService.getRejectList().toPromise();
      if (response.status === 200 && response.message === 'success') {
        this.reasonsLists = response.data;
      }
    } catch (error) {
      this.reasonsLists = [];
    }
  }

  //Ean Validate
  async openEanValidateModal() {
    this.eanValidateForm.reset({
      brandColumn: '',
      eanColumn: '',
    });
    this.isEanValidateFormValid = true;
    this.columnHeaders = this.columnDefs
      .filter(
        (col: any) =>
          col.field && col.field !== 'rowNum' && col.field !== 'action'
      )
      .map((col: any) => col.headerName);

    const modalRef = this.modalService.open(this.eanValidateModal, {
      backdrop: 'static',
      size: 'md',
    });
    try {
      const result = await modalRef.result;
      if (result !== 'confirmed') return;
    } catch (error: any) {
      if (error !== 'user-cancelled') {
        this.showNotification('Error', error, 'error');
      }
    }
  }

  checkEanValidationStatus(): void {
    if (!this.fileData?.data || this.fileData.data.length === 0) {
      this.isEanValidationDisabled = true;
      return;
    }
    const hasEanColumn = this.fileData.data[0].hasOwnProperty('ISEANValidated');
    if (!hasEanColumn) {
      this.isEanValidationDisabled = true;
      return;
    }
    const allYes = this.fileData.data.every(
      (row: any) => row.ISEANValidated === 'YES'
    );
    this.isEanValidationDisabled = !allYes;
  }

  async submitEanValidateForm(modal: any) {
    this.isEanValidateFormValid = true;
    if (this.eanValidateForm.invalid) {
      this.isEanValidateFormValid = false;
      this.eanValidateForm.markAllAsTouched();
      return;
    }
    const brandColumn = this.eanValidateForm.value.brandColumn;
    const eanColumn = this.eanValidateForm.value.eanColumn;
    if (!brandColumn || !eanColumn) {
      this.showNotification('Error', 'Invalid input', 'error');
      return;
    }
    this.processing = true;
    this.processingType = 'validate';
    try {
      const payload = {
        raw_json: this.fileData.data,
        client_uuid: this.clientUUID,
        file_id: this.fileData.file_id,
        file_name: this.fileName,
        brand_column: brandColumn,
        ean_column: eanColumn,
      };
      console.log(payload);
      const response = await this.productService
        .validateEAN(payload)
        .toPromise();
      if (response && response.message === 'Validation completed') {
        const notificationMessage = `

  <div style="
    text-align:center; 
    font-size:15px; 
    font-weight:600; 
    margin-bottom:12px; 
    color:#333;
  ">
    Validation Report
  </div>

  <div style="text-align:center; font-size:14px; line-height:1.4;">
    <div style="
      background:#e3f2fd;
      padding:10px; border-radius:8px; margin-bottom:10px;
      border-left:4px solid #1e88e5;
    ">
      <div style="font-size:14px; font-weight:600; color:#0d47a1;">
        📘 Total Rows
      </div>
      <div style="font-size:18px; font-weight:bold; color:#0d47a1;">
        ${response.total_rows}
      </div>
    </div>
    <div style="
      background:#dff5df;
      padding:10px; border-radius:8px; margin-bottom:10px;
      border-left:4px solid #28a745;
    ">
      <div style="font-size:14px; font-weight:600; color:#155724;">
        ✅ Successful
      </div>
      <div style="font-size:18px; font-weight:bold; color:#155724;">
        ${response.success_rows}
      </div>
    </div>
    <div style="
      background:#f8d7da;
      padding:10px; border-radius:8px;
      border-left:4px solid #e53935;
    ">
      <div style="font-size:14px; font-weight:600; color:#721c24;">
        ❌ Failed
      </div>
      <div style="font-size:18px; font-weight:bold; color:#721c24;">
        ${response.failed_rows}
      </div>
    </div>

  </div>
`;

        this.fileData.data = response.raw_json;
        this.rowData = this.formatGridData(response.raw_json);
        this.gridApi.setGridOption('rowData', this.rowData);
        this.checkEanValidationStatus();
        if (response.failed_rows === 0) {
          this.isEANValidated = true;
        } else {
          this.isEANValidated = false;
        }
        this.showNotificationValidation(
          'Success',
          notificationMessage,
          'success'
        );
        modal.close('confirmed');
      }
    } catch (error: any) {
      this.showNotification('Error', error, 'error');
    } finally {
      this.processing = false;
      this.processingType = null;
    }
  }

  showNotificationValidation(header: string, message: string, labelicon: any) {
    Swal.fire({
      title: `<span style="font-size:22px;">${header}</span>`,
      html: message,
      icon: labelicon,
      width: '380px',
      padding: '1rem',
      confirmButtonColor: '#364574',
      confirmButtonText: 'OK',
    });
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
