import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { pageSelection } from 'src/app/core/core.index';
import { PaginationService, tablePageSize } from 'src/app/shared/shared.index';
import { StoreAddComponent } from '../store-add/store-add.component';
import { UploadStoreComponent } from '../upload-store/upload-store.component';
import { StoreEditComponent } from '../store-edit/store-edit.component';
import { StoreService } from 'src/app/core/service/store/store.service';
import Swal from 'sweetalert2';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import { BulkBrandImportComponent } from '../bulk-brand-import/bulk-brand-import.component';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-store-list',
  standalone: false,
  templateUrl: './store-list.component.html',
  styleUrl: './store-list.component.scss',
})
export class StoreListComponent {
  public tableData: Array<any> = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<any>;
  public searchDataValue = '';
  filterColumn: string = 'Name';
  filterColumnsList: any[] = ['Name', 'Short Name', 'Email'];
  private filteredStoreData: Array<any> = [];
  private allStoreData: Array<any> = [];
  loadingStores: boolean = false;
  public currentSkip = 0;
  public currentLimit = this.pageSize;

  constructor(
    private pagination: PaginationService,
    private modalService: NgbModal,
    private storeService: StoreService,
    private commonSharedService: CommonSharedService
  ) {}

  public storeUploadResult: any =
    this.commonSharedService.StoreListObject.subscribe((res) => {
      if (res.result == 'success') {
        this.getStores();
      }
    });

  ngOnInit() {
    this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
      this.pageSize = res.pageSize;
      this.currentSkip = res.skip;
      this.currentLimit = res.limit;
      this.getTableData({ skip: res.skip, limit: res.limit });
    });
    this.getStores();
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

  async getStores() {
    try {
      this.loadingStores = true;
      let response = await this.storeService.getStores().toPromise();
      if (response) {
        this.allStoreData = response;
        this.filteredStoreData = [...this.allStoreData];
        this.totalData = this.filteredStoreData.length;
        this.getTableData({ skip: 0, limit: this.pageSize });
      }
    } catch (error) {
      this.allStoreData = [];
      this.filteredStoreData = [];
      this.totalData = 0;
    } finally {
      this.loadingStores = false;
    }
  }

  private getTableData(pageOption: pageSelection): void {
    this.tableData = [];
    this.serialNumberArray = [];
    const slicedData = this.filteredStoreData.slice(
      pageOption.skip,
      pageOption.limit
    );
    slicedData.forEach((res: any, index: number) => {
      res.sNo = pageOption.skip + index + 1;
      this.tableData.push(res);
      this.serialNumberArray.push(res.sNo);
    });

    this.dataSource = new MatTableDataSource<any>(this.tableData);

    this.pagination.calculatePageSize.next({
      totalData: this.totalData,
      pageSize: this.pageSize,
      tableData: this.tableData,
      serialNumberArray: this.serialNumberArray,
    });
  }


  public searchData(value: string): void {
    const searchTerm = value.trim().toLowerCase();
    this.filteredStoreData = this.allStoreData.filter((item: any) => {
      return (
        item.name?.toLowerCase().includes(searchTerm) ||
        item.store_code?.toLowerCase().includes(searchTerm) ||
        item.email_id?.toLowerCase().includes(searchTerm) ||
        item.telephone?.toLowerCase().includes(searchTerm) ||
        item.is_active?.toString().toLowerCase().includes(searchTerm)
      );
    });

    this.totalData = this.filteredStoreData.length;
    this.getTableData({ skip: 0, limit: this.pageSize });
  }

  deleteStore(id: any) {
    if (id) {
      Swal.fire({
        title: 'Confirmation',
        text: 'Are you sure you want to delete this store? This action cannot be undone.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#364574',
        cancelButtonColor: 'rgb(243, 78, 78)',
        confirmButtonText: 'Delete',
      }).then(async (result) => {
        if (result.value) {
          try {
            let response = await this.storeService.deleteStore(id).toPromise();
            if (
              response.status == 200 &&
              response.message == 'Store deleted successfully'
            ) {
              this.showNotification('Success', 'Store deleted', 'success');
              this.getStores().then(() => {
                this.pagination.changePagesize.next({
                  pageSize: this.pageSize,
                });
              });
            }
          } catch (error) {
            this.showNotification('Error', 'Store not deleted', 'error');
          }
        }
      });
    }
  }

  openStoreAddModal() {
    const dialogRef = this.modalService.open(StoreAddComponent, {
      size: 'xl',
      backdrop: 'static',
      windowClass: 'store-add-modal',
    });
    dialogRef.componentInstance.modalParams = {};
    dialogRef.result.then((result) => {
      if (result === 'success') {
        this.getStores().then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
      }
    });
  }

  openStoreUploadModal() {
    const dialogRef = this.modalService.open(UploadStoreComponent, {
      size: 'md',
      backdrop: 'static',
    });
    dialogRef.componentInstance.modalParams = {};
    dialogRef.result.then(async (result) => {
      if (result === 'success') {
        this.getStores().then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
      }
    });
  }

  openStoreEditModal(store: any) {
    const dialogRef = this.modalService.open(StoreEditComponent, {
      size: 'xl',
      backdrop: 'static',
    });
    dialogRef.componentInstance.modalParams = { store: store };
    dialogRef.result.then((result) => {
      if (result === 'success') {
        const skip = this.currentSkip;
        const limit = this.currentLimit;
        this.getStores().then(() => {
          this.getTableData({ skip, limit });
        });
      }
    });
  }

   openBrandImportModal() {
    const dialogRef = this.modalService.open(BulkBrandImportComponent, {
      size: 'md',
      backdrop: 'static',
    });
    dialogRef.componentInstance.modalParams = {};
    dialogRef.result.then(async (result) => {
      if (result === 'success') {
        this.getStores().then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
      }
    });
  }
  downloadStoreList() {
    this.storeService.getStorListWithBrand().subscribe((res: any) => {
      if (res && res.length > 0) {
        // Map the data for Excel export
        const exportData = res.map((store: any, index: number) => ({
          'S.No': index + 1,
          'Store Code': store.store_code,
          'Store Name': store.name,
          'Brand Name': store.brand_name,
          'Email ID': store.email_id,
          'Telephone': store.telephone,
          'Address': store.address,
          'City': store.city,
          'State': store.state,
          'Region': store.region,
          'Contact Person': store.contact_person_name,
          'Margin': store.margin || "",
          'Created On': store.created_on ? new Date(store.created_on).toLocaleDateString() : 'N/A',
          'Updated On': store.updated_on ? new Date(store.updated_on).toLocaleDateString() : 'N/A'
        }));

        // Create Excel workbook
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
        const workbook: XLSX.WorkBook = {
          Sheets: { 'Store List': worksheet },
          SheetNames: ['Store List'],
        };

        // Generate Excel file
        const excelBuffer: any = XLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
        });

        // Create blob and download
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        FileSaver.saveAs(blob, 'store-list.xlsx');
        
        this.showNotification('Success', 'Store list downloaded successfully', 'success');
      } else {
        this.showNotification('Error', 'No data found', 'error');
      }
    });
  }
}
