import { Component, Input, ViewChild } from '@angular/core';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { ExcelStyleFilterComponent } from '../excel-style-filter/excel-style-filter.component';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FileService } from 'src/app/core/service/file/file.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-deleted-preview',
  standalone: false,

  templateUrl: './deleted-preview.component.html',
  styleUrl: './deleted-preview.component.scss',
})
export class DeletedPreviewComponent {
    @Input() modalParams: any;
    fileData: any;
    headerNames: string[] = [];
    tableData: any[] = [];
    loading: boolean = false;
    selectedMonth: Date | undefined;
    selectedYear: Date | undefined;
    monthPickerConfig!: Partial<BsDatepickerConfig>;
    yearPickerConfig!: Partial<BsDatepickerConfig>;
    selectedMonthNumber: number | null = null;
    selectedYearNumber: number | null = null;
    saveClicked!: boolean;
    saveRejectedClicked!: boolean;
    fileName: string = '';
    pinnedTopRowData: any[] = [];
    @ViewChild('reasonModal') reasonModal: any;
    fullData: any[] = [];
    rowHeight = 40;
    viewportHeight = 600;
    buffer = 50;
    scrollContainer!: HTMLElement;
    alreadyLoadedUntil = 0;
    @ViewChild('agGrid') agGrid!: AgGridAngular;
    defaultColDef: any = {
      filter: ExcelStyleFilterComponent,
      cellClass: 'excel-cell',
      headerClass: 'excel-header',
      minWidth: 50,
      flex: 1,
      cellClassRules: {},
      cellStyle: undefined,
      headerTooltip: (params: any) =>
        params.colDef && params.colDef.headerName ? params.colDef.headerName : '',
    };
    public getRowClass = (params: any) => {
      if (params.node.rowPinned === 'top') {
        return 'excel-header-2';
      }
      return '';
    };
    public gridOptions: GridOptions = {
      context: {
        componentParent: this,
      },
      defaultColDef: {
        sortable: false,
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
      theme: 'legacy',
      suppressCellFocus: true,
      rowHeight: 22,
      headerHeight: 24,
      animateRows: true,
      rowModelType: 'clientSide',
      suppressRowHoverHighlight: true,
      rowClass: 'excel-row',
      suppressHorizontalScroll: false,
      suppressColumnVirtualisation: true,
       onFilterChanged: () => {
        this.anyFilterActive = this.gridApi.isAnyFilterPresent();
      },
      getRowStyle: (params) => {
        if (params.node.rowIndex! % 2 === 0) {
          return { backgroundColor: '#ffffff' };
        } else {
          return { backgroundColor: '#f8f9fa' };
        }
      },
    };
    public columnDefs: ColDef[] = [];
    public rowData: any[] = [];
    public gridApi!: GridApi;
    public columnApi: any;
    public anyFilterActive: boolean = false;
  
    constructor(
      private activeModal: NgbActiveModal,
      private fileService: FileService
    ) {}
  
    ngOnInit(): void {
      this.saveClicked = false;
      this.saveRejectedClicked = false;
      this.monthPickerConfig = {
        minMode: 'month',
        dateInputFormat: 'MMMM',
        showWeekNumbers: false,
        containerClass: 'theme-default',
      };
      this.yearPickerConfig = {
        minMode: 'year',
        dateInputFormat: 'YYYY',
        showWeekNumbers: false,
        containerClass: 'theme-default',
      };
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
          this.fullData = response.data;
          this.initializeGridColumns(response.data[0]);
          this.rowData = this.formatGridData(response.data);
          const isDualHeader = Object.values(this.fileData.data[0]).every(
            (val) => val === null || (typeof val === 'string' && !val.match(/\d/))
          );
          if (isDualHeader) {
            this.pinnedTopRowData = [this.fullData[0]];
            this.fullData = this.fullData.slice(1);
            this.rowData = this.rowData.slice(1);
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
          filter: false
        },
      ];
      this.columnDefs = [
        ...this.columnDefs,
        ...Object.keys(firstRow).map((key) => {
          return {
            headerName: key,
            field: key,
            valueGetter: (params: any) => {
              return params.data?.[key];
            },
          };
        }),
      ];
    }
    getMonthText = (monthNumber: number): string => {
      const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return months[monthNumber - 1] || 'Unknown';
  };
    private formatGridData(data: any[]): any[] {
      return data.map((row, index) => {
        const formattedRow: any = {
          rowNum: index + 1,
        };
        Object.keys(row).forEach((key) => {
          if(key === 'DateMonthYear-Month'){
            formattedRow[key] = this.getMonthText(row[key]);
          }else{
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
        return value;
      }
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        const date = new Date(value);
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
      }
      return String(value).trim();
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
}
