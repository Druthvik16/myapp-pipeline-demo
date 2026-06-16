import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class MasterService {

  constructor(private apiService: ApiService) { }

    getYears() {
    return this.apiService.get('master/list/years');
  }

   getMonths(year: string) {
    return this.apiService.get('master/list/months?year=' + year);
  }

  getDates(year: string, month: string) {
    return this.apiService.get('master/list/date?year=' + year + '&month=' + month);
  }

  getBrandCode() {
    return this.apiService.get('master/list/brandcode');
  }

  getStoreCode() {
    return this.apiService.get('master/list/storecode'
    );
  }

  getStatus() {
     return this.apiService.get('master/list/status' 
    );
  }

   getRegions() {
    return this.apiService.get('master/list/region');
  }

  getRejectList() {
    return this.apiService.get('master/reject-list');
  }

  createReject(reject: any) {
    return this.apiService.post('master/create-reject-list', reject);
  }
}
