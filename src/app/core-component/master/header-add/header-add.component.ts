import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UploadHeaderComponent } from '../upload-header/upload-header.component';
import { HeaderService } from 'src/app/core/service/header/header.service';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { KeyMappingDeleteLogsComponent } from '../key-mapping-delete-logs/key-mapping-delete-logs.component';

@Component({
  selector: 'app-header-add',
  standalone: false,
  templateUrl: './header-add.component.html',
  styleUrl: './header-add.component.scss',
})
export class HeaderAddComponent {
  mappingData: any = [];
  headerNames: string[] = [];
  keyMaps: string[][] = [];
  maxRows = 0;
  rowIndexes: number[] = [];
  searchTerm: string = '';
  highlightedHeaders: string[] = [];
  highlightedKeyMaps: string[][] = [];

  @ViewChild('reasonModal') reasonModal: any;
  deleteRemark: string = '';
  selectedDeleteKey: string = '';

  constructor(
    private modalService: NgbModal,
    private headerService: HeaderService,
    private commonSharedService: CommonSharedService,
    private sanitizer: DomSanitizer
  ) {}

  public storeUploadResult: any =
    this.commonSharedService.HeaderListObject.subscribe((res) => {
      if (res.result == 'success') {
        this.getHeadersLists();
      }
    });

  ngOnInit(): void {
    this.getHeadersLists();
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

  async getHeadersLists() {
    try {
      let response = await this.headerService.getHeaders().toPromise();
      if (response) {
        this.mappingData = response;
        this.headerNames = this.mappingData.map(
          (item: any) => item.header_name
        );
        this.keyMaps = this.mappingData.map((item: any) => item.key_map);
        this.maxRows = Math.max(...this.keyMaps.map((map) => map.length));
        this.rowIndexes = Array.from({ length: this.maxRows }, (_, i) => i);
      }
    } catch (error) {}
  }

  openHeaderAddModal() {
    const dialogRef = this.modalService.open(UploadHeaderComponent, {
      size: 'md',
      backdrop: 'static',
    });
    dialogRef.componentInstance.modalParams = {};
  }

  onSearchChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchTerm = inputElement.value;
  }

  getHighlightedText(text: string): SafeHtml {
    if (!this.searchTerm || !text) {
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }

    const regex = new RegExp(this.searchTerm, 'gi');
    const highlightedText = text.replace(
      regex,
      (match) => `<span style="background-color: #FE9F43;">${match}</span>`
    );
    return this.sanitizer.bypassSecurityTrustHtml(highlightedText);
  }

  async deleteRow(headerId: number, key: string) {
    this.deleteRemark = '';
    this.selectedDeleteKey = key;
    const modalRef = this.modalService.open(this.reasonModal, {
      backdrop: 'static',
      size: 'sm',
      centered: true,
    });
    try {
      const result = await modalRef.result;
      if (result !== 'confirmed') return;
      const payload = {
        header_id: headerId,
        key: key,
        remark: this.deleteRemark.replace(/\n/g, ' ').trim(),
      };
      let response = await this.headerService
        .deleteKeyMapping(payload)
        .toPromise();
      if (response && response.message === 'Key mapping deleted successfully') {
        this.showNotification(
          'Success',
          'Key Mapping deleted successfully',
          'success'
        );
        this.getHeadersLists();
      } else {
        this.showNotification('Error', response.message, 'error');
      }
    } catch (error: any) {
      if (error !== 'user-cancelled') {
        this.showNotification('Error', error, 'error');
      }
    }
  }

  submitRemark(modal: any) {
    if (!this.deleteRemark.trim()) {
      this.showNotification('Warning', 'Please enter a reason.', 'warning');
      return;
    }
    modal.close('confirmed');
  }

  viewKeyMappingDeleteLog() {
    const keyMappingDeleteModal = this.modalService.open(
      KeyMappingDeleteLogsComponent,
      {
        size: 'xl',
        backdrop: 'static',
      }
    );
    keyMappingDeleteModal.componentInstance.modalParams = {};
  }

  closeModal(modal: any) {
    modal.dismiss('user-cancelled');
  }
}
