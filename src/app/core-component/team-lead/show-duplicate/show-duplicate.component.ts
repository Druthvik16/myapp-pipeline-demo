import {
  Component,
  ElementRef,
  Input,
  Renderer2,
} from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ListService } from 'src/app/core/service/list/list.service';
import { DuplicateFilePreviewComponent } from '../duplicate-file-preview/duplicate-file-preview.component';

@Component({
  selector: 'app-show-duplicate',
  standalone: false,
  templateUrl: './show-duplicate.component.html',
  styleUrl: './show-duplicate.component.scss',
})
export class ShowDuplicateComponent {
  @Input() modalParams: any;
  fileData: any;
  headerNames: string[] = [];
  tableData: any[] = [];
  loading: boolean = false;
  standardHeaders: string[] = [];
  headerMappings: any[] = [];
  originalData: any[] = [];
  fileName: string = '';
  fullData: any[] = [];
  rowHeight = 40;
  viewportHeight = 600;
  buffer = 50;
  scrollContainer!: HTMLElement;
  alreadyLoadedUntil = 0;

  constructor(
    private activeModal: NgbActiveModal,
    private listService: ListService,
    private modalService: NgbModal,
    private renderer: Renderer2,
    private elRef: ElementRef
  ) {}

  ngOnInit() {
    this.fileName = this.modalParams.fileName;
    this.getDataList();
  }

  async getDataList() {
    this.loading = true;
    this.tableData = [];
    try {
      const filter = {
        store_code: this.modalParams.scanParams.storeCode,
        brand: this.modalParams.scanParams.brand,
        month: this.modalParams.scanParams.month,
        year: this.modalParams.scanParams.year,
      };
      let response = await this.listService.getDataList(filter).toPromise();
      if (response) {
        this.originalData = response;
        this.fileData = response;
        this.fullData = response;
        this.processAllRowsAsData(response);
        this.loadInitialChunk();
      }
    } catch (error) {
      this.loading = false;
    }finally{
      this.loading = false
    }
  }

  processAllRowsAsData(response: any) {
    const requiredKeys = [
      'store_code',
      'brand',
      'customer_name',
      'secondary_bill_date',
      'month',
      'year',
      'instance',
      'remark',
    ];

    if (response && response.length > 0) {
      this.headerNames = requiredKeys;
      this.tableData = response.map((row: any) => {
        const rowData: any = {};
        this.headerNames.forEach((key) => {
          rowData[key] = this.formatValue(row[key]);
        });
        return rowData;
      });
    }
  }

  loadInitialChunk() {
    const rowsPerViewport = Math.ceil(this.viewportHeight / this.rowHeight);
    const chunk = this.fullData.slice(0, rowsPerViewport + this.buffer);
    this.tableData = chunk.map((row: any) => {
      const formatted: any = {};
      this.headerNames.forEach((key) => {
        formatted[key] = this.formatValue(row[key]);
      });
      return formatted;
    });
    this.alreadyLoadedUntil = this.tableData.length;
  }

  appendMoreRows() {
    const nextChunk = this.fullData.slice(
      this.alreadyLoadedUntil,
      this.alreadyLoadedUntil + this.buffer
    );
    if (nextChunk.length > 0) {
      const formattedChunk = nextChunk.map((row: any) => {
        const formatted: any = {};
        this.headerNames.forEach((key) => {
          formatted[key] = this.formatValue(row[key]);
        });
        return formatted;
      });
      this.tableData = [...this.tableData, ...formattedChunk];
      this.alreadyLoadedUntil += formattedChunk.length;
    }
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

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string' && value.includes('T00:00:00.000Z')) {
      const date = new Date(value);
      return date.toLocaleDateString();
    }
    return value.toString();
  }


  openDuplicateFileModal(row: any) {
    console.log(row);
    const dialogRef = this.modalService.open(DuplicateFilePreviewComponent, {
      backdrop: 'static',
      modalDialogClass: 'modal-fullscreen',
    });
    dialogRef.componentInstance.modalParams = {
      fileId: row.file_id,
      fileName: this.fileName,
    };
  }

  closeModal() {
    this.activeModal.close();
  }
}
