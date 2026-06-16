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
import Swal from 'sweetalert2';
import { MasterService } from 'src/app/core/service/master/master.service';

@Component({
  selector: 'app-file-level-tracker',
  standalone: false,
  templateUrl: './file-level-tracker.component.html',
  styleUrl: './file-level-tracker.component.scss',
})
export class FileLevelTrackerComponent {
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
      headerName: 'File Name',
      field: 'original_file_name',
      minWidth: 160,
      flex: 1,
      wrapText: true,
      autoHeight: true,
      cellClass: 'wrap-cell'
    },
    {
      headerName: 'Unformatted',
      field: 'unformatted',
      width: 100,
      minWidth: 90,
      maxWidth: 120
    },
    {
      headerName: 'Formatted',
      field: 'formatted',
      width: 100,
      minWidth: 90,
      maxWidth: 120,
    },
    {
      headerName: 'Approval Pending',
      field: 'approval_pending',
      width: 120,
      minWidth: 110,
      maxWidth: 140,
    },
    {
      headerName: 'Approved',
      field: 'approved',
      width: 100,
      minWidth: 90,
      maxWidth: 120,
    },
    {
      headerName: 'Duplicate',
      field: 'duplicate',
      width: 100,
      minWidth: 90,
      maxWidth: 120
    },
    {
      headerName: 'Uploaded',
      field: 'uploaded',
      width: 100,
      minWidth: 90,
      maxWidth: 120,
    },
    {
      headerName: 'Rejected',
      field: 'rejected',
      width: 100,
      minWidth: 90,
      maxWidth: 120,
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
  tempSelectedField: string | null = null;
  tempDateRange: Date[] | null = null;
  filter = {
    selectedField: null as string | null,
    dateRange: null as Date[] | null,
  };
  status: any = []
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
        this.clientUuid = res?.uuid || '';
        if (res?.result) {
          if (res.uuid) {
            await this.getClients();
            const matchedClient = this.clients.find(
              (client: any) => client.uuid === this.clientUuid
            );
            if (matchedClient?.id) {
              await this.getFileLevelTracker();
            }
          }
          else {
            this.clientUuid = res?.uuid
            await this.getFileLevelTracker();
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
      this.clientId = matchedClient.id;
      await this.getFileLevelTracker();
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

  async getFileLevelTracker() {
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
      const fromDate = this.filter.dateRange?.[0]
        ? formatDate(this.filter.dateRange[0], 'yyyy-MM-dd', 'en-IN')
        : "";
      const toDate = this.filter.dateRange?.[1]
        ? formatDate(this.filter.dateRange[1], 'yyyy-MM-dd', 'en-IN')
        : "";
      const status = this.filter.selectedField
      const response = await this.trackerService.getFileLevelTrackers(clientUUId, status,
        fromDate, toDate
      ).toPromise();
      if (response) {
        this.allUploadedData = response.map((row: any, index: number) => {
          const dateFields = ['unformatted', 'formatted', 'approval_pending', 'approved', 'duplicate', 'uploaded', 'rejected'];
          dateFields.forEach(field => {
            if (row[field]) {
              const date = new Date(row[field]);
              if (!isNaN(date.getTime())) {
                row[field] = formatDate(date, 'dd-MM-yyyy', 'en-IN');
              }
            } else {
              row[field] = '';
            }
          });
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
      (row: any) => ({
        'File Name': row.original_file_name,
        'Unformatted': row.unformatted,
        'Formatted': row.formatted,
        'Approval Pending': row.approval_pending,
        'Approved': row.approved,
        'Duplicate': row.duplicate,
        'Uploaded': row.uploaded,
        'Rejected': row.rejected,
      })
    );
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'File Tracker Data': worksheet },
      SheetNames: ['File Tracker Data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'file-tracker-data.xlsx');
    this.downloadExcel = false;
  }


  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    if (this.loading) {
      this.gridApi.setGridOption('loading', true);
    }
  }

  get isFilterActive(): boolean {
    return !!(this.filter.dateRange || this.filter.selectedField);
  }

  async openDateFilterModal() {
    this.tempSelectedField = this.filter.selectedField;
    this.tempDateRange = this.filter.dateRange;
    this.modalService.open(this.dateFilterModal, {
      backdrop: 'static',
      size: 'md',
      windowClass: 'date-filter-modal',
    });
    this.loadFilterDropdowns();
  }

  async resetFilter(modal: any) {
    this.tempSelectedField = null;
    this.tempDateRange = null;
    this.filter.selectedField = null;
    this.filter.dateRange = null;
    await this.getFileLevelTracker()
    modal.close();
    this.anyFilterActive = false;

  }

  get isApplyDisabled(): boolean {
    return !(this.tempSelectedField && this.tempDateRange);
  }

  async applyFilter(modal: any) {
    this.applyDateFilterClicked = true;
    this.filter.selectedField = this.tempSelectedField;
    this.filter.dateRange = this.tempDateRange;
    await this.getFileLevelTracker()
    this.applyDateFilterClicked = false;
    modal.close();
    this.anyFilterActive = this.isFilterActive;
  }


  isInRange(dateStr: string, range: Date[]): boolean {
    if (!dateStr || !range || range.length !== 2) return false;
    const [start, end] = range;
    const date = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
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
    this.filter.selectedField = null;
    this.filter.dateRange = null;
    this.tempSelectedField = null;
    this.tempDateRange = null;
    await this.getFileLevelTracker()
    this.gridApi.onFilterChanged();
    window.dispatchEvent(new Event('filterChanged'));
    this.anyFilterActive = false;
  }

  isAnyFilterActive(): boolean {
    const hasDate = this.filter.dateRange?.length === 2;
    const hasField = !!this.filter.selectedField;
    const hasGridFilters = this.gridApi?.isAnyFilterPresent?.() || false;
    return (hasDate && hasField) || hasGridFilters;
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

  async loadFilterDropdowns() {
    this.isLoadStatus = true;
    await Promise.all([
      this.getStatus(),
    ]);
    this.isLoadStatus = false;
  }

  ngOnDestroy() {
    this.clientSub?.unsubscribe();
  }
} 