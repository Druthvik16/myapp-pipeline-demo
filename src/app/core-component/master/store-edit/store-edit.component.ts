import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from 'src/app/core/service/client/client.service';
import { StoreService } from 'src/app/core/service/store/store.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-store-edit',
  standalone: false,
  templateUrl: './store-edit.component.html',
  styleUrl: './store-edit.component.scss',
})
export class StoreEditComponent {
  @Input() modalParams: any;
  storeEditForm!: FormGroup;
  isValidForm!: boolean;
  alphaWithWithSpace = '^[A-Za-z]+([ ]?[A-Za-z])*$';
  emailpattern =
    /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  mobilePattern = '^(?!0{10}$)[0-9]{10}$';

  clients: any = [];
  categories: any = [];
  salesGroups: any = [];
  brands: any = [];
  subBrands: any = [];
  storeUuid: any;
  brandMappings: any[] = [];

  constructor(
    private activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private storeService: StoreService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.isValidForm = true;
    this.storeEditForm = this.formBuilder.group({
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
    this.getStoreById(this.modalParams?.store.uuid);
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

  async updateStore() {
    if (this.storeEditForm.valid) {
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
          const selectedClient = this.clients.find(
            (c: any) =>
              c.uuid === this.storeEditForm.get('client.id')?.value ||
              c.id === this.storeEditForm.get('client.id')?.value
          );
          const client_uuid = selectedClient?.uuid ?? '';
          const payload = {
            store_code: this.storeEditForm.get('storeCode')?.value,
            client_uuid,
            name: this.storeEditForm.get('name')?.value,
            email_id: this.storeEditForm.get('email')?.value,
            telephone: this.storeEditForm.get('telephone')?.value,
            address: this.storeEditForm.get('address')?.value,
            city: this.storeEditForm.get('city')?.value,
            state: this.storeEditForm.get('state')?.value,
            region: this.storeEditForm.get('region')?.value,
            contact_person_name:
              this.storeEditForm.get('contactPersonName')?.value,
            category_id: this.storeEditForm.get('category.id')?.value,
            sale_group_id: this.storeEditForm.get('salesGroup.id')?.value,
            margin: this.storeEditForm.get('margin')?.value,
            store_brand: this.brandMappings.map((m) => ({
              brand_id: m.brandId,
              sub_brand_id: m.subBrandId,
            })),
            uuid: this.modalParams?.store.uuid,
          };
          let response = await this.storeService
            .updateStore(payload, this.modalParams?.store.uuid)
            .toPromise();
          if (
            response.status == 200 &&
            response.message == 'Store updated successfully'
          ) {
            this.showNotification(
              'Success',
              'Store updated successfully',
              'success'
            );
            this.activeModal.close('success');
          } else {
            this.showNotification('Error', response.message, 'error');
          }
        }
      } catch (error) {}
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

  async getStoreById(id: any) {
    try {
      let response = await this.storeService.getStore(id).toPromise();
      if (response) {
        this.storeEditForm.patchValue({
          storeCode: response.store_code,
          name: response.name,
          email: response.email_id,
          telephone: response.telephone,
          address: response.address,
          city: response.city,
          state: response.state,
          region: response.region,
          contactPersonName: response.contact_person_name,
          client: {
            id: response.client_id,
          },
          category: {
            id: response.category_id,
          },
          salesGroup: {
            id: response.sale_group_id,
          },
          margin: response.margin,
        });
        await this.loadBrandMappings(response.id);
      }
    } catch (error) {}
  }

  async loadBrandMappings(storeId: number) {
    try {
      let response = await this.storeService.getBrandMasterList().toPromise();
      if (response) {
        const mappingsForStore = response.filter(
          (m: any) => m.store_id === storeId
        );
        this.brandMappings = mappingsForStore.map((m: any) => {
          const brand = this.brands.find((b: any) => b.id === m.brand_id);
          const subBrand = this.subBrands.find(
            (sb: any) => sb.id === m.sub_brand_id
          );

          return {
            brandId: m.brand_id,
            brandName: brand?.brand_name || '',
            subBrandId: m.sub_brand_id,
            subBrandName: subBrand?.sub_brand_name || '',
          };
        });
        this.updateBrandValidators();
      }
    } catch (error) {
      console.error('Error in loadBrandMappings:', error);
      this.brandMappings = [];
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

  updateBrandValidators() {
    const brandControl = this.storeEditForm.get('brand.id');
    const subBrandControl = this.storeEditForm.get('subBrand.id');
    brandControl?.clearValidators();
    subBrandControl?.clearValidators();
    brandControl?.updateValueAndValidity();
    subBrandControl?.updateValueAndValidity();
  }

  addBrandMapping() {
    const brandId = +this.storeEditForm.get('brand.id')?.value;
    const brand = this.brands.find((b: any) => b.id === brandId);
    if (!brandId || !brand) {
      this.showNotification('Warning', 'Please select a Brand', 'warning');
      return;
    }

    // Get all sub-brands associated with the selected brand
    const relatedSubBrands = this.subBrands.filter((sb: any) => sb.brand_id === brandId);

    if (!relatedSubBrands || relatedSubBrands.length === 0) {
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
      relatedSubBrands.forEach((subBrand: any) => {
        const exists = this.brandMappings.some(
          (m: any) => m.brandId === brandId && m.subBrandId === subBrand.id
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

    this.storeEditForm.get('brand.id')?.setValue('');
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
