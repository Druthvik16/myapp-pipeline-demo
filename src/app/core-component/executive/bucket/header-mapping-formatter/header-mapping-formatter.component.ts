import { Component, ElementRef, Input, Renderer2 } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FileService } from 'src/app/core/service/file/file.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-header-mapping-formatter',
  standalone: false,
  templateUrl: './header-mapping-formatter.component.html',
  styleUrl: './header-mapping-formatter.component.scss',
})
export class HeaderMappingFormatterComponent {
  @Input() modalParams: any;
  fileData: any;
  headerNames: string[] = [];
  tableData: any[] = [];
  loading: boolean = false;
  standardHeaders: string[] = [];
  headerMappings: any[] = [];
  selectedHeader: string = '';
  selectedHeaderChecked: boolean = true;
  disabledHeaders: string[] = [];
  fileName: any;
  fullData: any[] = [];
  rowHeight = 40;
  viewportHeight = 600;
  buffer = 50;
  alreadyLoadedUntil = 0;
  scrollContainer!: HTMLElement;
  isNAApplicable: boolean = false;
  isFileLocked: boolean = false;
  lockMessage: string = '';
  standardHeader: string = '';
  userData: any;

  constructor(
    private activeModal: NgbActiveModal,
    private fileService: FileService,
    private renderer: Renderer2,
    private elRef: ElementRef
  ) {}

  ngOnInit() {
    this.userData = JSON.parse(sessionStorage.getItem('LOGINUSER') || '{}');
    this.fileName = this.modalParams.fileName;
    this.selectedHeader = this.modalParams.selectedHeader;
    this.selectedHeaderChecked = !!this.selectedHeader;
    this.standardHeader = this.modalParams.standardHeader;
    this.isFileLocked = this.modalParams.fileLocked;
    this.lockMessage = this.modalParams.lockMessage;
    this.disabledHeaders = (this.modalParams.allMappedHeaders || [])
      .filter(
        (item: any) =>
          item.mapped_file_header &&
          item.standard_header !== this.modalParams.standardHeader
      )
      .map((item: any) => item.mapped_file_header);
    if (this.modalParams.fileData) {
      this.fileData = this.modalParams.fileData;
      this.extractHeaderMappings(this.fileData.data);
    } else {
      this.getFileData(this.modalParams.fieldId);
    }
    this.isNAApplicable = false;
    const matchedHeader = (this.modalParams.headerLists || []).find(
      (item: any) => item.header_name === this.modalParams.standardHeader
    );
    if (matchedHeader && matchedHeader.is_na_applicable === true) {
      this.isNAApplicable = true;
    }
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
      let response = await this.fileService.getFileData(id).toPromise();
      if (response) {
        this.fileData = response;
        if (this.fileData?.state_id !== 2) {
          this.activeModal.close('forceReload');
          this.showNotification(
            'info',
            'This file was already edited successfully.',
            'info'
          );
          return;
        }
        this.extractHeaderMappings(response.data);
      }
    } catch (error) {
      this.loading = false;
    } finally {
      this.loading = false;
    }
  }

  extractHeaderMappings(data: any[]) {
    this.headerMappings = [];
    this.fullData = data;
    this.headerNames = data.length ? Object.keys(data[0]) : [];
    this.loadInitialChunk();
  }

  loadInitialChunk() {
    const rowsPerViewport = Math.ceil(this.viewportHeight / this.rowHeight);
    const chunk = this.fullData
      .slice(0, rowsPerViewport + this.buffer)
      .map((row) => {
        const formattedRow: any = {};
        Object.keys(row).forEach((key) => {
          formattedRow[key] = this.formatValue(row[key]);
        });
        return formattedRow;
      });
    this.tableData = [...chunk];
    this.alreadyLoadedUntil = this.tableData.length;
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
    const nextChunk = this.fullData
      .slice(this.alreadyLoadedUntil, this.alreadyLoadedUntil + nextChunkSize)
      .map((row) => {
        const formattedRow: any = {};
        Object.keys(row).forEach((key) => {
          formattedRow[key] = this.formatValue(row[key]);
        });
        return formattedRow;
      });

    if (nextChunk.length > 0) {
      this.tableData = [...this.tableData, ...nextChunk];
      this.alreadyLoadedUntil += nextChunk.length;
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

  // formatValue(value: any): string {
  //   if (value === null || value === undefined) {
  //     return value;
  //   }
  //   if (typeof value === 'string' && value.includes('T00:00:00.000Z')) {
  //     const date = new Date(value);
  //     return date.toLocaleDateString();
  //   }
  //   return value;
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

  toggleHeaderCheckbox(event: any, header: string) {
    if (event.target.checked) {
      this.selectedHeader = header;
      this.selectedHeaderChecked = true;
    } else {
      this.selectedHeader = '';
      this.selectedHeaderChecked = false;
    }
  }

  mapNAHeader() {
    const result: any = {
      standardHeader: this.modalParams.standardHeader,
      newMappedHeader: 'N/A',
      updatedData: this.fileData,
    };
    this.activeModal.close(result);
  }

  mapHeader() {
    const result: any = {
      standardHeader: this.modalParams.standardHeader,
      updatedData: this.fileData,
    };
    if (this.selectedHeaderChecked) {
      const isHeaderAlreadyMapped = this.modalParams.allMappedHeaders?.some(
        (item: any) =>
          item.mapped_file_header === this.selectedHeader &&
          item.standard_header !== this.modalParams.standardHeader
      );
      if (isHeaderAlreadyMapped) {
        this.showNotification(
          'Error',
          `"${this.selectedHeader}" is already mapped to another standard header.`,
          'error'
        );
        this.selectedHeader = '';
        this.selectedHeaderChecked = false;
        return;
      }
      result.newMappedHeader = this.selectedHeader;
    } else {
      result.removedHeader = this.modalParams.selectedHeader;
    }
    this.activeModal.close(result);
  }

  closeModal() {
    this.activeModal.close();
  }
}
