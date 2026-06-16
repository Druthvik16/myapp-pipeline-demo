import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private apiService: ApiService) { }

  validateMappingFile(validateBody: any) {
    return this.apiService.post('product/test-mapping-file', validateBody);
  }

  saveProduct(product: any) {
    return this.apiService.post('product/save', product)
  }

  getJsonFormat() {
    return this.apiService.get('product/json-format');
  }

  headerMappingLists(clientUuid: any) {
    return this.apiService.get('product/header-mapping-list/' + clientUuid);
  }

   uploadProducts(product: any) {
    return this.apiService.postFileBlob('product/upload-products', product)
  }

  productLists() {
    return this.apiService.get('product/list');
  }

  getProductById(productId: any){
    return this.apiService.get('product/list/'+ productId);
  }

  validateEAN(ean: any) {
    return this.apiService.post('product/validate-ean', ean)
  }

}
