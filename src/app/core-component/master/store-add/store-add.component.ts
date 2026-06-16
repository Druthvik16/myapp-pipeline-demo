import {
  Component,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from 'src/app/core/service/client/client.service';
import { StoreService } from 'src/app/core/service/store/store.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-store-add',
  standalone: false,
  templateUrl: './store-add.component.html',
  styleUrl: './store-add.component.scss',
})
export class StoreAddComponent {
  storeAddForm!: FormGroup;
  isValidForm!: boolean;
  alphaWithWithSpace = '^[A-Za-z]+([ ]?[A-Za-z])*$';
  emailpattern =
    /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  mobilePattern = '^(?!0{10}$)[0-9]{10}$';
  brandMappings: Array<{
    brandId: number;
    brandName: string;
    subBrandId: number;
    subBrandName: string;
  }> = [];
  clients: any = [];
  brandMaster: any = [];
  categories: any = [];
  salesGroups: any = [];
  brands: any = [];
  subBrands: any = [];
  salesGroupDescriptions: any = [];
  selectedClient: any = null;

  constructor(
    private activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private storeService: StoreService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.isValidForm = true;
    this.storeAddForm = this.formBuilder.group({
      storeCode: ['', Validators.required],
      name: [
        '',
        [Validators.required, Validators.pattern(this.alphaWithWithSpace)],
      ],
      email: ['', [Validators.pattern(this.emailpattern)]],
      telephone: [''],
      address: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      region: ['', Validators.required],
      contactPersonName: [''],
      client: this.formBuilder.group({
        id: ['', Validators.required],
      }),
      category: this.formBuilder.group({
        id: [''],
      }),
      brand: this.formBuilder.group({
        id: [''],
      }),
      subBrand: this.formBuilder.group({
        id: [''],
      }),
      salesGroup: this.formBuilder.group({
        id: [''],
      }),
      margin: [''],
    });
    this.getClients();
    this.getCategoriesMaster();
    this.getBrands();
    this.getSubBrands();
    this.getSalesGroup();
  }

  updateBrandValidators() {
    const brandControl = this.storeAddForm.get('brand.id');
    const subBrandControl = this.storeAddForm.get('subBrand.id');
    brandControl?.clearValidators();
    subBrandControl?.clearValidators();
    brandControl?.updateValueAndValidity();
    subBrandControl?.updateValueAndValidity();
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

  async saveStore() {
    if (this.storeAddForm.valid) {
      try {
        if (this.brandMappings.length === 0) {
          this.showNotification(
            'Warning',
            'Please add at least one brand mapping',
            'warning'
          );
          return;
        } else {
          this.isValidForm = true;
          const payload = {
            store_code: this.storeAddForm.get('storeCode')?.value,
            client_uuid: this.storeAddForm.get('client.id')?.value,
            name: this.storeAddForm.get('name')?.value,
            email_id: this.storeAddForm.get('email')?.value,
            telephone: this.storeAddForm.get('telephone')?.value,
            address: this.storeAddForm.get('address')?.value,
            city: this.storeAddForm.get('city')?.value,
            state: this.storeAddForm.get('state')?.value,
            region: this.storeAddForm.get('region')?.value,
            contact_person_name:
              this.storeAddForm.get('contactPersonName')?.value,
            category_id: this.storeAddForm.get('category.id')?.value,
            sale_group_id: this.storeAddForm.get('salesGroup.id')?.value,
            margin: this.storeAddForm.get('margin')?.value,
            store_brand: this.brandMappings.map((m) => ({
              brand_id: m.brandId,
              sub_brand_id: m.subBrandId,
            })),
          };
          let response = await this.storeService
            .createStore(payload)
            .toPromise();
          if (
            response.status == 200 &&
            response.message == 'Store created successfully'
          ) {
            this.showNotification(
              'Success',
              'Store created successfully',
              'success'
            );
            this.activeModal.close('success');
          } else {
            this.showNotification('Error', response.message, 'error');
          }
        }
      } catch (error: any) {
        this.showNotification('Error', error, 'error');
        this.isValidForm = false;
      }
    } else {
      this.isValidForm = false;
    }
  }

  async getClients() {
    try {
      let response = await this.clientService.getClients().toPromise();
      if (response) {
        this.clients = [{ uuid: '', name: 'Select Client' }, ...response];
      }
    } catch (error) {
      this.clients = [];
      this.clients.unshift({ uuid: '', name: 'Select Client' });
    }
  }

  async getCategoriesMaster() {
    try {
      let response = await this.storeService
        .getCategoryBrandMasterList()
        .toPromise();
      if (response) {
        this.categories = response;
        this.categories.unshift({ id: '', category_name: 'Select Category' });
      } else {
        this.categories = [];
        this.categories.unshift({ id: '', category_name: 'Select Category' });
      }
    } catch (error) {
      this.categories = [];
      this.categories.unshift({ id: '', category_name: 'Select Category' });
    }
  }

  async getSalesGroup() {
    try {
      let response = await this.storeService
        .getSaleGroupMasterList()
        .toPromise();
      if (response) {
        this.salesGroups = response;
        this.salesGroups.unshift({
          id: '',
          sale_group_name: 'Select Sales Group',
        });
      }
    } catch (error) {
      this.salesGroups = [];
      this.salesGroups.unshift({
        id: '',
        sale_group_name: 'Select Sales Group',
      });
    }
  }

  async getBrands() {
    try {
      let response = await this.storeService.getBrandList().toPromise();
      if (response) {
        this.brands = response;
        this.brands.unshift({ id: '', brand_name: 'Select Brand' });
      }
    } catch (error) {
      this.brands = [];
      this.brands.unshift({ id: '', brand_name: 'Select Brand' });
    }
  }

  async getSubBrands() {
    try {
      let response = await this.storeService.getSubBrandList().toPromise();
      if (response) {
        this.subBrands = response;
        this.subBrands.unshift({ id: '', sub_brand_name: 'Select Sub Brand' });
      }
    } catch (error) {
      this.subBrands = [];
      this.subBrands.unshift({ id: '', sub_brand_name: 'Select Sub Brand' });
    }
  }

  addBrandMapping() {
    const brandId = +this.storeAddForm.get('brand.id')?.value;
    const brand = this.brands.find((b: any) => b.id === brandId);
    if (!brandId || !brand) {
      this.showNotification('Warning', 'Please select a Brand', 'warning');
      return;
    }

    // Get all sub-brands associated with the selected brand
    const relatedSubBrands = this.subBrands.filter((sb: any) => sb.brand_id === brandId);

    if (!relatedSubBrands || relatedSubBrands.length === 0) {
      // If no sub-brands exist, still add a mapping with empty sub-brand
      const exists = this.brandMappings.some((m) => m.brandId === brandId && m.subBrandId === 0);
      if (!exists) {
        this.brandMappings.push({
          brandId,
          brandName: brand.brand_name,
          subBrandId: 0,
          subBrandName: ''
        });
      }
    } else {
      // Add mappings for all related sub-brands, skipping duplicates
      relatedSubBrands.forEach((subBrand: any) => {
        const exists = this.brandMappings.some(
          (m) => m.brandId === brandId && m.subBrandId === subBrand.id
        );
        if (!exists) {
          this.brandMappings.push({
            brandId,
            brandName: brand.brand_name,
            subBrandId: subBrand.id,
            subBrandName: subBrand.sub_brand_name,
          });
        }
      });
    }

    // reset brand selection
    this.storeAddForm.get('brand.id')?.setValue('');
    this.updateBrandValidators();
  }

  removeMapping(index: number) {
    this.brandMappings.splice(index, 1);
    this.updateBrandValidators();
  }

  closeModal() {
    this.activeModal.close();
  }
}
