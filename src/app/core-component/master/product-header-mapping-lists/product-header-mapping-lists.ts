import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { pageSelection, PaginationService, tablePageSize } from 'src/app/shared/shared.index';
import { ProductHeaderMappingAdd } from '../product-header-mapping-add/product-header-mapping-add';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import { skip, Subscription } from 'rxjs';
import { ProductService } from 'src/app/core/service/product/product.service';
import { ClientService } from 'src/app/core/service/client/client.service';

@Component({
  selector: 'app-product-header-mapping-lists',
  standalone: false,
  templateUrl: './product-header-mapping-lists.html',
  styleUrl: './product-header-mapping-lists.scss'
})
export class ProductHeaderMappingLists {

  public tableData: Array<any> = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<any>;
  public searchDataValue = '';
  filterColumn: string = 'Name';
  filterColumnsList: any[] = ['Name'];
  private filteredProductsData: Array<any> = [];
  private allProductsData: Array<any> = [];
  loadingProducts: boolean = false;
  public selectedFilterColumn: string = this.filterColumn;
  public currentSkip = 0;
  public currentLimit = this.pageSize;
  clientUuid: string = '';
  private clientSub!: Subscription;
  clients: any = [];

  constructor(
    private pagination: PaginationService,
    private modalService: NgbModal,
    private commonSharedService: CommonSharedService,
    private productService: ProductService,
    private clientService: ClientService
  ) { }

  
  async ngOnInit() {
    await this.getClients();
    const storedClient = this.commonSharedService.selectedClientUUID.value;
    if (storedClient?.result && storedClient.uuid) {
      this.clientUuid = storedClient.uuid;
      this.getProductHeaderMapping(this.clientUuid);
    } else {
      this.getProductHeaderMapping(this.clientUuid);
    }
    this.clientSub = this.commonSharedService.selectedClientUUID
      .pipe(skip(1))
      .subscribe((res) => {
        if (res?.result) {
          this.clientUuid = res.uuid;
          this.getProductHeaderMapping(this.clientUuid);
        }
      });
    this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
      this.pageSize = res.pageSize;
      this.currentSkip = res.skip;
      this.currentLimit = res.limit;
      this.getTableData({ skip: res.skip, limit: res.limit });
    });

  }

  async getProductHeaderMapping(clientUuid: any) {
    try {
      this.loadingProducts = true;
      let response = await this.productService.headerMappingLists(clientUuid).toPromise();
      if (response) {
        this.allProductsData = response;
        this.allProductsData = response.map((item: any, index: number) => {
          const client = this.clients.find((c: any) => c.id === item.client_id);
          return {
            ...item,
            sNo: index + 1,
            client_name: client ? client.name : 'Unknown'
          };
        });
        this.filteredProductsData = [...this.allProductsData];
        this.totalData = this.filteredProductsData.length;
        this.getTableData({ skip: 0, limit: this.pageSize });
      }
    } catch (error) {
      this.allProductsData = [];
      this.totalData = 0;
    } finally {
      this.loadingProducts = false;
    }
  }

  private getTableData(pageOption: pageSelection): void {
    this.tableData = [];
    this.serialNumberArray = [];
    const slicedData = this.filteredProductsData.slice(
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
    this.filteredProductsData = this.allProductsData.filter((item: any) => {
      return (
        item.system_column_header?.toLowerCase().includes(searchTerm) ||
        item.mapped_column_header?.toLowerCase().includes(searchTerm)
      );
    });
    this.totalData = this.filteredProductsData.length;
    this.getTableData({ skip: 0, limit: this.pageSize });
  }


  openProductMappingAddModal() {
    const dialogRef = this.modalService.open(ProductHeaderMappingAdd, {
      size: 'lg',
      backdrop: 'static',
    });
    dialogRef.componentInstance.modalParams = {};
    dialogRef.result.then((result) => {
      if (result?.result === true) {
        this.getProductHeaderMapping(this.clientUuid).then(() => {
          this.pagination.changePagesize.next({
            pageSize: this.pageSize,
          });
        });
      }
    });
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

}
