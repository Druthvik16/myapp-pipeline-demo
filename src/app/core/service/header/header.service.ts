import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  constructor(private apiService: ApiService) {}
 
 
  getHeaders() {
    return this.apiService.get('header/list');
  }

  getHeaderTemplate() {
    return this.apiService.getFile('header/template');
  }

  uploadHeader(client: any) {
    return this.apiService.post('header/upload', client);
  }

  deleteKeyMapping(payload: any){
   return this.apiService.deleteByPayload('header/key-mapping', payload);
  }

  getDeletedKeyMappingLogs(){
    return this.apiService.get('header/mapping-log');
  }

   getHeaderLists(){
    return this.apiService.get('header/list');
  }
}
