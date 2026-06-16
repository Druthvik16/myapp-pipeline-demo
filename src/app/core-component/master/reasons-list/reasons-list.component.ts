import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PaginationService, tablePageSize } from 'src/app/shared/shared.index';
import { UserAddComponent } from '../../user/user-add/user-add.component';
import { ReasonsAddComponent } from '../reasons-add/reasons-add.component';
import { MatTableDataSource } from '@angular/material/table';
import { MasterService } from 'src/app/core/service/master/master.service';
import { pageSelection } from 'src/app/core/models/models';

@Component({
  selector: 'app-reasons-list',
  standalone: false,
  templateUrl: './reasons-list.component.html',
  styleUrl: './reasons-list.component.scss'
})
export class ReasonsListComponent {

  public tableData: Array<any> = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<any>;
  public searchDataValue = '';
  filterColumn: string = 'Name';
  filterColumnsList: any[] = ['Name', 'Role', 'Email', 'Mobile'];
  private filteredReasonData: Array<any> = [];
  private allReasonData: Array<any> = [];
  loadingReasons: boolean = false;
  public selectedFilterColumn: string = this.filterColumn;
  public currentSkip = 0;
  public currentLimit = this.pageSize;

  constructor(
    private pagination: PaginationService,
    private modalService: NgbModal,
    private masterService: MasterService
  ) { }

  ngOnInit() {
    this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
      this.pageSize = res.pageSize;
      this.currentSkip = res.skip;
      this.currentLimit = res.limit;
      this.getTableData({ skip: res.skip, limit: res.limit });
    });
    this.getReasons();
  }

  async getReasons() {
    try {
      this.loadingReasons = true;
      let response = await this.masterService.getRejectList().toPromise();
      if (response.status === 200 && response.message === "success") {
        this.allReasonData = response.data;
        this.filteredReasonData = [...this.allReasonData];
        this.totalData = this.filteredReasonData.length;
        this.getTableData({ skip: 0, limit: this.pageSize });
      }
    } catch (error) {
      this.allReasonData = [];
      this.totalData = 0;
    } finally {
      this.loadingReasons = false;
    }
  }

  private getTableData(pageOption: pageSelection): void {
    this.tableData = [];
    this.serialNumberArray = [];
    const slicedData = this.filteredReasonData.slice(
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
      this.filteredReasonData = [...this.allReasonData];
    } else {
      this.filteredReasonData = this.allReasonData.filter((user) => {
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

    this.totalData = this.filteredReasonData.length;
    this.getTableData({ skip: 0, limit: this.pageSize });
  }


  openReasonAddModal() {
    const dialogRef = this.modalService.open(ReasonsAddComponent, {
      size: 'md',
      backdrop: 'static',
    });
    dialogRef.componentInstance.modalParams = {};
    dialogRef.result.then((result) => {
      if (result === 'success') {
        this.getReasons().then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
      }
    });
  }
}
