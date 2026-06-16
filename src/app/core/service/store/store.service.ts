import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  constructor(private apiService: ApiService) { }

  getStores() {
    return this.apiService.get('store/list');
  }

  getStore(uuid: string) {
    return this.apiService.get('store/list/' + uuid);
  }
  getStorListWithBrand() {
    return this.apiService.get('store/list-with-brand');
  }

  createStore(client: any) {
    return this.apiService.post('store/create', client);
  }

  updateStore(store: any, uuid: any) {
    return this.apiService.put('store/update/' + uuid, store);
  }

  deleteStore(id: any) {
    return this.apiService.delete('store/delete/' + id);
  }

  getBrandMasterList(){
    return this.apiService.get('store/brand-master/list');
  }

  getCategoryBrandMasterList(){
    return this.apiService.get('store/category-master/list');
  }

  getSaleGroupMasterList(){
    return this.apiService.get('store/sale-group-master/list');
  }

  getBrandList(){
    return this.apiService.get('store/brand/list');
  }

   getSubBrandList(){
    return this.apiService.get('store/sub-brand/list');
  }

  getBulkImportTemplate(){
     return this.apiService.getFile('store/bulk-import-template');
  }

  addStoreBulk(store: any){
    return this.apiService.postFileBlob('store/bulk-import', store);
  }

   getStoreCodeHeaderKeys() {
    return this.apiService.get('bot/getStoreCodeHeaderKeys');
  }

  getStoreBrands(store_code: string) {
    return this.apiService.get('store/all-brands/' + store_code);
  }

   addBrandBulk(brand: any){
    return this.apiService.postFileBlob('store/bulk-import-brands', brand);
  }

   getBulkImportTemplateBrand(){
     return this.apiService.getFile('store/bulk-import-template-brands');
  }
}
