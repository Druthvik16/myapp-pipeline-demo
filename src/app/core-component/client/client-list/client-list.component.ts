import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { pageSelection } from 'src/app/core/core.index';
import { routes } from 'src/app/core/helpers/routes';
import { PaginationService, tablePageSize } from 'src/app/shared/shared.index';
import { ClientAddComponent } from '../client-add/client-add.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientEditComponent } from '../client-edit/client-edit.component';
import { ClientService } from 'src/app/core/service/client/client.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-client-list',
  standalone: false,
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss',
})
export class ClientListComponent {
  public routes = routes;
  public tableData: Array<any> = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<any>;
  public searchDataValue = '';
  filterColumn: string = 'Name';
  filterColumnsList: any[] = ['Name', 'Short Name', 'Email'];
  private filteredClientData: Array<any> = [];
  private allClientData: Array<any> = [];
  loadingClients: boolean = false;
  public selectedFilterColumn: string = this.filterColumn;
  public currentSkip = 0;
  public currentLimit = this.pageSize;

  constructor(
    private pagination: PaginationService,
    private modalService: NgbModal,
    private clientService: ClientService
  ) {}

  ngOnInit() {
    this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
      this.pageSize = res.pageSize;
      this.currentSkip = res.skip;
      this.currentLimit = res.limit;
      this.getTableData({ skip: res.skip, limit: res.limit });
    });
    this.getClients();
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

  async getClients() {
    try {
      this.loadingClients = true;
      let response = await this.clientService.getClients().toPromise();
      if (response) {
        this.allClientData = response;
        this.filteredClientData = [...this.allClientData];
        this.totalData = this.filteredClientData.length;
        this.getTableData({ skip: 0, limit: this.pageSize });
      }
    } catch (error) {
      this.allClientData = [];
      this.filteredClientData = [];
      this.totalData = 0;
    } finally {
      this.loadingClients = false;
    }
  }

  private getTableData(pageOption: pageSelection): void {
    this.tableData = [];
    this.serialNumberArray = [];
    const slicedData = this.filteredClientData.slice(
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

  selectFilterColumn(filter: string): void {
    this.filterColumn = filter;
    this.selectedFilterColumn = filter;
    this.searchData(this.searchDataValue);
  }

  public searchData(value: string): void {
    const searchTerm = value.trim().toLowerCase();

    if (!searchTerm) {
      this.filteredClientData = [...this.allClientData];
    } else {
      this.filteredClientData = this.allClientData.filter((client) => {
        switch (this.filterColumn) {
          case 'Name':
            return client.name?.toLowerCase().includes(searchTerm);
          case 'Short Name':
            return client.short_name?.toLowerCase().includes(searchTerm);
          case 'Email':
            return client.email_id?.toLowerCase().includes(searchTerm);
          default:
            return true;
        }
      });
    }
    this.totalData = this.filteredClientData.length;
    this.getTableData({ skip: 0, limit: this.pageSize });
  }

  deleteClient(id: any) {
    if (id) {
      Swal.fire({
        title: 'Confirmation',
        text: 'Are you sure you want to delete this client? This action cannot be undone.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#364574',
        cancelButtonColor: 'rgb(243, 78, 78)',
        confirmButtonText: 'Delete',
      }).then(async (result) => {
        if (result.value) {
          try {
            let response = await this.clientService
              .deleteClient(id)
              .toPromise();
            if (response && response.message == 'Client deleted successfully') {
              this.showNotification('Success', 'Client deleted', 'success');
              this.getClients().then(() => {
                this.pagination.changePagesize.next({
                  pageSize: this.pageSize,
                });
              });
            }
          } catch (error) {
            this.showNotification('Error', 'Client not deleted', 'error');
          }
        }
      });
    }
  }

  openClientAddModal() {
    const dialogRef = this.modalService.open(ClientAddComponent, {
      size: 'xl',
      backdrop: 'static',
    });
    dialogRef.componentInstance.modalParams = {};
    dialogRef.result.then((result) => {
      if (result === 'success') {
        this.getClients().then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
      }
    });
  }

  async openClientEditModal(clientuuid: any) {
    const dialogRef = this.modalService.open(ClientEditComponent, {
      size: 'xl',
      backdrop: 'static',
    });
    dialogRef.componentInstance.modalParams = { clientuuid: clientuuid };
    try {
      const result = await dialogRef.result;
      if (result === 'success') {
        const skip = this.currentSkip;
        const limit = this.currentLimit;
        this.getClients().then(() => {
          this.getTableData({ skip, limit });
        });
      }
    } catch (error) {}
  }
}
