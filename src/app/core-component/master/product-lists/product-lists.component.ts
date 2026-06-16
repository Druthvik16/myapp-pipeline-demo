import { Component, NgZone } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import { ProductUploadComponent } from '../product-upload/product-upload.component';
import { ProductService } from 'src/app/core/service/product/product.service';
import { Router } from '@angular/router';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';
import { skip, Subscription } from 'rxjs';
import { ClientService } from 'src/app/core/service/client/client.service';

@Component({
  selector: 'app-product-lists',
  standalone: false,
  templateUrl: './product-lists.component.html',
  styleUrl: './product-lists.component.scss',
})
export class ProductListsComponent {
  public totalData = 0;
  filteredProductListsData: any = null;
  clients: any = [];
  clientUuid: any = '';
  private clientSub!: Subscription;
  clientId: any;
  loading: boolean = false;
  private allProductListsData: any = [];
  searchTerm: string = '';
  private searchTimeout: any = null;

  columnDefs: ColDef[] = [
    {
      headerName: '#',
      field: 'rowNum',
      width: 50,
      minWidth: 40,
      maxWidth: 60,
      valueGetter: (params) =>
        params.node?.rowIndex != null ? params.node.rowIndex + 1 : null,
    },
    {
      headerName: 'Brand',
      field: 'brand',
      width: 70,
      minWidth: 70,
      maxWidth: 70,
    },
    {
      headerName: 'Sub Brand',
      field: 'sub_brand',
      width: 100,
      minWidth: 100,
      maxWidth: 100,
    },
    {
      headerName: 'Product Group',
      field: 'product_group',
      width: 140,
      minWidth: 140,
      maxWidth: 140,
    },
    {
      headerName: 'Style Code',
      field: 'style_code',
      width: 180,
      minWidth: 180,
      maxWidth: 180,
    },
    {
      headerName: 'EAN',
      field: 'ean',
      width: 120,
      minWidth: 120,
      maxWidth: 130,
    },
    {
      headerName: 'Collection',
      field: 'collection',
      width: 120,
      minWidth: 120,
      maxWidth: 120,
    },
    {
      headerName: 'Product Type',
      field: 'product_type',
      width: 120,
      minWidth: 120,
      maxWidth: 120,
      wrapText: true,
      autoHeight: true,
      cellClass: 'wrap-cell',
    },
    {
      headerName: 'Category',
      field: 'category',
      width: 80,
      minWidth: 80,
      maxWidth: 100,
    },
    {
      headerName: 'Gender',
      field: 'gender',
      width: 90,
      minWidth: 90,
      maxWidth: 120,
    },
    {
      headerName: 'Created On',
      field: 'created_on',
      width: 90,
      minWidth: 90,
      maxWidth: 120,
      valueFormatter: (params) => this.formatDate(params.value),
    },
    {
      headerName: 'Updated On',
      field: 'updated_on',
      width: 90,
      minWidth: 90,
      maxWidth: 120,
      valueFormatter: (params) => this.formatDate(params.value),
    },
    {
      headerName: 'Status',
      field: 'is_active',
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      cellRenderer: (params: any) => {
        const isActive = params.value === 1;
        return `
        <span class="badge badge-xs shadow-none ${
          isActive ? 'badge-soft-success' : 'badge-soft-danger'
        }">
          <i class="ti ti-point-filled me-1"></i>
          ${isActive ? 'Active' : 'Inactive'}
        </span>
      `;
      },
    },
    {
      headerName: 'Action',
      filter: false,
      sortable: false,
      resizable: false,
      width: 50,
      pinned: 'right',
      cellRenderer: (params: any) => {
        const btn = document.createElement('a');
        btn.innerHTML = '<i class="feather icon-eye feather-eye"></i>';
        btn.classList.add('p-2', 'action-eye-icon');
        btn.style.cursor = 'pointer';
        btn.title = 'View Details';
        btn.addEventListener('click', () => {
          this.goToDetailsPage(params.data.id);
        });
        return btn;
      },
    },
  ];
  defaultColDef = {
    resizable: true,
    sortable: true,
    cellClass: 'excel-cell',
    headerClass: 'excel-header',
    autoHeight: false,
    wrapText: false,
    cellStyle: undefined,
  };
  gridOptions: GridOptions = {
    context: {
      componentParent: this,
    },
    defaultColDef: this.defaultColDef,
    theme: 'legacy',
    suppressCellFocus: true,
    rowHeight: 25,
    headerHeight: 24,
    animateRows: true,
    suppressRowHoverHighlight: true,
    rowClass: 'excel-row',
    suppressHorizontalScroll: false,
    suppressColumnVirtualisation: false,
    rowBuffer: 10,
    enableCellTextSelection: true,
    ensureDomOrder: false,
  };
  gridApi!: GridApi;
  isSearching: boolean = false;

  constructor(
    private clientService: ClientService,
    private commonSharedService: CommonSharedService,
    private modalService: NgbModal,
    private productService: ProductService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    const storedClient = this.commonSharedService.selectedClientUUID.value;
    const hasValidStoredClient = storedClient?.result && storedClient.uuid;
    if (hasValidStoredClient) {
      this.clientUuid = storedClient.uuid;
      this.handleClientSelection(this.clientUuid);
    }
    this.clientSub = this.commonSharedService.selectedClientUUID
      .pipe(skip(hasValidStoredClient ? 1 : 0))
      .subscribe(async (res) => {
        if (res?.result) {
          if (res.uuid) {
            this.clientUuid = res.uuid || '';
            await this.getClients();
            const matchedClient = this.clients.find(
              (client: any) => client.uuid === this.clientUuid
            );
            if (matchedClient?.id) {
              await this.getProductLists();
            }
          } else {
            this.clientUuid = res.uuid;
            await this.getProductLists();
          }
        }
      });
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

  async handleClientSelection(uuid: string) {
    await this.getClients();
    const matchedClient = this.clients.find(
      (client: any) => client.uuid === uuid
    );
    if (matchedClient?.id) {
      await this.getProductLists();
    }
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

  async getProductLists() {
    try {
      this.loading = true;
      if (this.gridApi) {
        this.gridApi.setGridOption('loading', true);
      }
      const response = await this.productService.productLists().toPromise();
      if (response) {
        this.allProductListsData = response.map((item: any, index: number) => ({
          ...item,
          rowNum: index + 1,
        }));
        this.filteredProductListsData = [...this.allProductListsData];
        this.totalData = this.filteredProductListsData.length;
        this.loading = false;
      } else {
        this.allProductListsData = [];
        this.filteredProductListsData = [];
        this.loading = false;
      }
    } catch (error) {
      this.allProductListsData = [];
      this.filteredProductListsData = [];
      this.loading = false;
      if (this.gridApi) {
        this.gridApi.setGridOption('loading', false);
      }
    } finally {
      this.loading = false;
      if (this.gridApi) {
        this.gridApi.setGridOption('loading', false);
      }
    }
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    if (this.loading) {
      this.gridApi.setGridOption('loading', true);
    }
  }

  ngOnDestroy() {
    this.clientSub?.unsubscribe();
    if (this.gridApi) {
      this.gridApi.destroy();
    }
  }

  openProductUploadModal() {
    const dialogRef = this.modalService.open(ProductUploadComponent, {
      size: 'md',
      backdrop: 'static',
    });
    dialogRef.componentInstance.modalParams = {};
    dialogRef.result.then(async (result) => {
      if (result === 'success') {
        this.getProductLists();
      }
    });
  }

  goToDetailsPage(uuid: any) {
    this.ngZone.run(() => {
      this.router.navigateByUrl('master/products-details/' + uuid);
    });
  }

  formatDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value;
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.isSearching = true;
    this.gridApi?.setGridOption('loading', true);
    this.searchTimeout = setTimeout(() => {
      this.applyGlobalSearch(this.searchTerm);
    }, 300);
  }

  applyGlobalSearch(searchValue: string): void {
    const hasSearch = !!searchValue?.trim();
    setTimeout(() => {
      if (!hasSearch) {
        this.filteredProductListsData = [...this.allProductListsData];
        this.totalData = this.filteredProductListsData.length;
        this.isSearching = false;
        this.gridApi?.setGridOption('loading', false);
        return;
      }
      const search = searchValue.toLowerCase().trim();
      this.filteredProductListsData = this.allProductListsData.filter(
        (row: any) =>
          Object.keys(row).some((key) => {
            const value = row[key];
            if (!value) return false;

            if (key === 'created_on' || key === 'updated_on') {
              return this.formatDate(value).toLowerCase().includes(search);
            }

            return value.toString().toLowerCase().includes(search);
          })
      );
      this.totalData = this.filteredProductListsData.length;
      this.isSearching = false;
      this.gridApi?.setGridOption('loading', false);
    }, 0);
  }
}
