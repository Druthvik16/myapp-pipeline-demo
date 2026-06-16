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

@Component({
  selector: 'app-bot-level-tracker',
  standalone: false,
  templateUrl: './bot-level-tracker.component.html',
  styleUrl: './bot-level-tracker.component.scss',
})
export class BotLevelTrackerComponent {
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
      width: 60,
      minWidth: 50,
      maxWidth: 80,
      suppressSizeToFit: true  // Keep this column fixed
    },
    {
      headerName: 'Received On',
      field: 'received_on',
      width: 90,
      minWidth: 90,
      maxWidth: 100,
    },
    {
      headerName: 'Email',
      field: 'email',
      width: 130,
      wrapText: true,
      autoHeight: true,
      cellClass: 'wrap-cell',
    },
    {
      headerName: 'File Name',
      field: 'file_name',
      width: 170,
      minWidth: 170,
      wrapText: true,
      autoHeight: true,
      cellClass: 'wrap-cell',
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 60,
      minWidth: 60,
      maxWidth: 100,
    },
    {
      headerName: 'Remark',
      field: 'remark',
      minWidth: 150,
      flex: 1.5,
      wrapText: true,
      autoHeight: true,
      cellClass: 'wrap-cell',
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
  rowsSelected: boolean = false;
  @ViewChild('dateFilterModal') dateFilterModal!: TemplateRef<any>;
  bsDateConfig: Partial<BsDaterangepickerConfig> = {
    dateInputFormat: 'DD/MM/YYYY',
    rangeInputFormat: 'DD/MM/YYYY',
    containerClass: 'theme-default',
    showWeekNumbers: false,
    adaptivePosition: false,
  };
  filter = {
    receivedOnRange: null as Date[] | null,
    status: null as string | null,
  };
  tempReceivedOnRange: Date[] | null = null;
  tempStatus: string | null = null

  constructor(
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
        if (res?.result && res.uuid) {
          this.clientUuid = res.uuid;
          await this.getClients();
          const matchedClient = this.clients.find(
            (client: any) => client.uuid === this.clientUuid
          );
          if (matchedClient?.id) {
            this.clientId = matchedClient.id;
            await this.getBotLevelTracker();
          }
        }
      });
  }

  async handleClientSelection(uuid: string) {
    await this.getClients();
    const matchedClient = this.clients.find(
      (client: any) => client.uuid === uuid
    );
    if (matchedClient?.id) {
      this.clientId = matchedClient.id;
      await this.getBotLevelTracker();
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

  async getBotLevelTracker() {
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
      const status = this.tempStatus || ""
      const fromDate = this.tempReceivedOnRange?.[0]
        ? formatDate(this.tempReceivedOnRange[0], 'yyyy-MM-dd', 'en-IN')
        : '';
      const toDate = this.tempReceivedOnRange?.[1]
        ? formatDate(this.tempReceivedOnRange[1], 'yyyy-MM-dd', 'en-IN')
        : '';
      const response = await this.trackerService.getBotLevelTrackers(status,
        fromDate, toDate
      ).toPromise();
      if (response && response.length > 0) {
        this.allUploadedData = response.map((row: any, index: number) => {
          if (row.received_on) {
            const receivedDate = new Date(row.received_on);
            if (!isNaN(receivedDate.getTime())) {
              row.received_on = formatDate(receivedDate, 'dd-MM-yyyy', 'en-IN');
            }
          }
          row.rowNum = index + 1;
          return row;
        });
        this.filteredUploadedData = [...this.allUploadedData];
      }else{
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
        'Received On': row.received_on,
        'Email': row.email,
        'File Name': row.file_name,
        'Status': row.status,
        'Remark': row.remark,
      })
    );
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Bot Tracker Data': worksheet },
      SheetNames: ['Bot Tracker Data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'bot-tracker-data.xlsx');
    this.downloadExcel = false;
  }


  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    if (this.loading) {
      this.gridApi.setGridOption('loading', true);
    }
  }

  get isFilterActive(): boolean {
    return !!(this.filter.receivedOnRange || this.filter.status);
  }

  openDateFilterModal() {
    this.tempReceivedOnRange = this.filter.receivedOnRange;
    this.tempStatus = this.filter.status;
    this.modalService.open(this.dateFilterModal, {
      backdrop: 'static',
      size: 'md',
      windowClass: 'date-filter-modal',
    });
  }

  resetTempDateFields(): void {
    this.tempReceivedOnRange = null;
    this.tempStatus = null;
  }

  async applyDateFilter(modal: any) {
    this.applyDateFilterClicked = true;
    this.filter.receivedOnRange = this.tempReceivedOnRange;
    this.filter.status = this.tempStatus;
    await this.getBotLevelTracker()
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
    this.filter.receivedOnRange = null;
    this.filter.status = null;
    this.tempReceivedOnRange = null;
    this.tempStatus = null;
    this.getBotLevelTracker()
    this.gridApi.onFilterChanged();
    window.dispatchEvent(new Event('filterChanged'));
    this.anyFilterActive = false;
  }

  isAnyFilterActive(): boolean {
    const hasDate = this.filter.receivedOnRange?.length === 2;
    const hasStatus = !!this.filter.status;
    const hasGridFilters = this.gridApi?.isAnyFilterPresent?.() || false;
    return hasDate || hasStatus || hasGridFilters;
  }

  ngOnDestroy() {
    this.clientSub?.unsubscribe();
  }
} 
