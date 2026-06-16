import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { routes } from 'src/app/core/helpers/routes';
import { UserAddComponent } from '../user-add/user-add.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { pageSelection } from 'src/app/core/core.index';
import { PaginationService, tablePageSize } from 'src/app/shared/shared.index';
import { UserEditComponent } from '../user-edit/user-edit.component';
import { UserService } from 'src/app/core/service/user/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-list',
  standalone: false,
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent {
  public routes = routes;

  public tableData: Array<any> = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<any>;
  public searchDataValue = '';
  filterColumn: string = 'Name';
  filterColumnsList: any[] = ['Name', 'Role', 'Email', 'Mobile'];
  private filteredUserData: Array<any> = [];
  private allUserData: Array<any> = [];
  loadingUsers: boolean = false;
  public selectedFilterColumn: string = this.filterColumn;
  public currentSkip = 0;
  public currentLimit = this.pageSize;

  constructor(
    private pagination: PaginationService,
    private modalService: NgbModal,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
      this.pageSize = res.pageSize;
      this.currentSkip = res.skip;
      this.currentLimit = res.limit;
      this.getTableData({ skip: res.skip, limit: res.limit });
    });
    this.getUsers();
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

  async getUsers() {
    try {
      this.loadingUsers = true;
      let response = await this.userService.getUsers().toPromise();
      if (response) {
        this.allUserData = response;
        this.filteredUserData = [...this.allUserData];
        this.totalData = this.filteredUserData.length;
        this.getTableData({ skip: 0, limit: this.pageSize });
      }
    } catch (error) {
      this.allUserData = [];
      this.totalData = 0;
    } finally {
      this.loadingUsers = false;
    }
  }

  private getTableData(pageOption: pageSelection): void {
    this.tableData = [];
    this.serialNumberArray = [];

    const slicedData = this.filteredUserData.slice(
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
      this.filteredUserData = [...this.allUserData];
    } else {
      this.filteredUserData = this.allUserData.filter((user) => {
        switch (this.filterColumn) {
          case 'Name':
            return user.staff_name.toLowerCase().includes(searchTerm);
          case 'Role':
            return user.role_name.toLowerCase().includes(searchTerm);
          case 'Email':
            return user.email_id.toLowerCase().includes(searchTerm);
          case 'Mobile':
            return user.mobile_no.toLowerCase().includes(searchTerm);
          default:
            return true;
        }
      });
    }

    this.totalData = this.filteredUserData.length;
    this.getTableData({ skip: 0, limit: this.pageSize });
  }

  deleteUser(id: any) {
    if (id > 0) {
      Swal.fire({
        title: 'Confirmation',
        text: 'Are you sure you want to delete this user? This action cannot be undone.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#364574',
        cancelButtonColor: 'rgb(243, 78, 78)',
        confirmButtonText: 'Delete',
      }).then(async (result) => {
        if (result.value) {
          try {
            let response = await this.userService.deleteUser(id).toPromise();
            if (
              response.status_code == 200 &&
              response.message == 'User deleted successfully'
            ) {
              this.showNotification('Success', 'User deleted', 'success');
              this.getUsers().then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
            }
          } catch (error) {
            this.showNotification('Error', 'User not deleted', 'error');
          }
        }
      });
    }
  }

  openUserAddModal() {
    const dialogRef = this.modalService.open(UserAddComponent, {
      size: 'md',
      backdrop: 'static',
    });
    dialogRef.componentInstance.modalParams = {};
    dialogRef.result.then((result) => {
      if (result === 'success') {
        this.getUsers().then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
      }
    });
  }

  openUserEditModal(user: any) {
    const dialogRef = this.modalService.open(UserEditComponent, {
      size: 'md',
      backdrop: 'static',
    });
    dialogRef.componentInstance.modalParams = { user: user };
    dialogRef.result.then((result) => {
      if (result === 'success') {
        const skip = this.currentSkip;
        const limit = this.currentLimit;
        this.getUsers().then(() => {
          this.getTableData({ skip, limit });
        });
      }
    });
  }
}
