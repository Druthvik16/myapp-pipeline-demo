import { Component, ElementRef, Input, Renderer2 } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FileService } from 'src/app/core/service/file/file.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-duplicate-file-preview',
  standalone: false,
  templateUrl: './duplicate-file-preview.component.html',
  styleUrl: './duplicate-file-preview.component.scss',
})

export class DuplicateFilePreviewComponent {
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
  rowHeight = 40;
  viewportHeight = 600;
  buffer = 50;
  scrollContainer!: HTMLElement;
  alreadyLoadedUntil = 0;

  constructor(
    private activeModal: NgbActiveModal,
    private fileService: FileService,
    private renderer: Renderer2,
    private elRef: ElementRef
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
      if (response) {
        this.fileData = response;
        this.stateId = response.state_id;
        this.dualHeaderActive = this.stateId > 2;
        if (this.dualHeaderActive && response.data.length > 0) {
          this.displayHeaders = response.data[0];
        }
        this.processAllRowsAsData(response);
      }
    } catch (error) {
      this.loading = false;
    } finally {
      this.loading = false;
    }
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

  // formatValue(value: any): string {
  //   if (value === null || value === undefined) {
  //     return '';
  //   }
  //   if (typeof value === 'string' && value.includes('T00:00:00.000Z')) {
  //     const date = new Date(value);
  //     return date.toLocaleDateString();
  //   }
  //   return value.toString();
  // }

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

  closeModal() {
    this.activeModal.close();
  }
}
