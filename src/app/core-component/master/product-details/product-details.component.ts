import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from 'src/app/core/service/product/product.service';

@Component({
  selector: 'app-product-details',
  standalone: false,
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent {

  product!: any;
  productDetails!: any
  uuid!: any;
  loadingProducts!: boolean;
  originalTableData: any[] = [];
  tableData: any[] = [];
  public totalData = 0;
  public searchDataValue = '';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private productService: ProductService) {
    this.uuid = this.activatedRoute.snapshot.params['uuid']
  }


  ngOnInit(): void {
    if (this.uuid) {
      this.getProduct(this.uuid);
    }
  }

  async getProduct(UUID: string) {
    try {
      this.loadingProducts = true;
      let response = await this.productService.getProductById(UUID).toPromise();
      if (response) {
        this.product = response
       this.originalTableData = response.mrp_list.map((item: any, index: number) => ({
        ...item,
        sNo: index + 1
      }));
        this.tableData = [...this.originalTableData]
        this.totalData = this.tableData.length
        this.loadingProducts = false;
      }
    }
    catch (e) {
      this.loadingProducts = false;
    }
  }

  public searchData(value: string): void {
    const searchTerm = value.trim().toLowerCase();
    this.tableData = this.originalTableData.filter((item: any) => {
      return (
        item.mrp?.toLowerCase().includes(searchTerm) ||
        item.style_code?.toLowerCase().includes(searchTerm) ||
        item.wef?.toLowerCase().includes(searchTerm) ||
        item.created_on?.toLowerCase().includes(searchTerm) ||
        item.updated_on?.toLowerCase().includes(searchTerm) ||
        item.is_active?.toString().toLowerCase().includes(searchTerm)
      );
    });
    this.totalData = this.tableData.length
  }

  setUserStatusClass(active: any) {
    let cls = 'badge badge-label bg-dark';
    if (active == 0) {
      cls = 'badge badge-label bg-danger';
    }
    else if (active == 1) {
      cls = 'badge badge-label bg-success';
    }
    return cls;
  }

  back() {
    this.router.navigateByUrl("master/product-lists");
  }
}
