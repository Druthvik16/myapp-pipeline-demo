import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { pageSelection } from 'src/app/core/models/models';
import { UserService } from 'src/app/core/service/user/user.service';
import { PaginationService, tablePageSize } from 'src/app/shared/shared.index';
import Swal from 'sweetalert2';
import { StaffAddComponent } from '../staff-add/staff-add.component';
import { StaffEditComponent } from '../staff-edit/staff-edit.component';

@Component({
  selector: 'app-staff-list',
  standalone: false,
  templateUrl: './staff-list.component.html',
  styleUrl: './staff-list.component.scss',
})
export class StaffListComponent {
  public tableData: Array<any> = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<any>;
  public searchDataValue = '';
  filterColumn: string = 'Name';
  filterColumnsList: any[] = ['Name', 'Email', 'Mobile'];
  private filteredStaffData: Array<any> = [];
  private allStaffData: Array<any> = [];
  loadingStaffs: boolean = false
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
    this.getStaffs();
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

  async getStaffs() {
    try {
      this.loadingStaffs = true
      let response = await this.userService.getStaffs().toPromise();
      if (response) {
        this.allStaffData = response;
        this.filteredStaffData = [...this.allStaffData];
        this.totalData = this.filteredStaffData.length;
        this.getTableData({ skip: 0, limit: this.pageSize });
      }
    } catch (error) {
      this.allStaffData = [];
      this.filteredStaffData = [];
      this.totalData = 0;
    } finally{
      this.loadingStaffs = false
    }
  }

  private getTableData(pageOption: pageSelection): void {
    this.tableData = [];
    this.serialNumberArray = [];

    const slicedData = this.filteredStaffData.slice(
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
      this.filteredStaffData = [...this.allStaffData];
    } else {
      this.filteredStaffData = this.allStaffData.filter((staff) => {
        switch (this.filterColumn) {
          case 'Name':
            return staff.staff_name.toLowerCase().includes(searchTerm);
          case 'Email':
            return staff.email_id.toLowerCase().includes(searchTerm);
          case 'Mobile':
            const normalizedSearch = searchTerm.replace(/[^0-9]/g, ''); // keep only digits
            const mobileStr = staff.mobile_no
              ?.toString()
              .replace(/[^0-9]/g, '');
            return mobileStr.includes(normalizedSearch);
          default:
            return true;
        }
      });
    }

    this.totalData = this.filteredStaffData.length;
    this.getTableData({ skip: 0, limit: this.pageSize });
  }

  deleteStaff(id: any) {
    if (id > 0) {
      Swal.fire({
        title: 'Confirmation',
        text: 'Are you sure you want to delete this staff? This action cannot be undone.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#364574',
        cancelButtonColor: 'rgb(243, 78, 78)',
        confirmButtonText: 'Delete',
      }).then(async (result) => {
        if (result.value) {
          try {
            let response = await this.userService.deleteStaff(id).toPromise();
            if (
              response.status_code == 200 &&
              response.message == 'Staff deleted successfully'
            ) {
              this.showNotification('Success', 'Staff deleted', 'success');
              this.getStaffs().then(() => {
                this.pagination.changePagesize.next({
                  pageSize: this.pageSize,
                });
              });
            }
          } catch (error) {
            this.showNotification('Error', 'Staff not deleted', 'error');
          }
        }
      });
    }
  }

  openUserAddStaff() {
    const dialogRef = this.modalService.open(StaffAddComponent, {
      size: 'md',
      backdrop: 'static',
    });
    dialogRef.componentInstance.modalParams = {};
    dialogRef.result.then((result) => {
      if (result === 'success') {
        this.getStaffs().then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
      }
    });
  }

  openStaffEditModal(staff: any) {
    const dialogRef = this.modalService.open(StaffEditComponent, {
      size: 'md',
      backdrop: 'static',
    });
    dialogRef.componentInstance.modalParams = { staff: staff };
    dialogRef.result.then((result) => {
      if (result === 'success') {
        const skip = this.currentSkip;
        const limit = this.currentLimit;
        this.getStaffs().then(() => {
          this.getTableData({ skip, limit });
        })
      }
    });
  }
}
