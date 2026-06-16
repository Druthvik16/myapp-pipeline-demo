import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class ProcessService {
  constructor(private apiService: ApiService) {}

  validateMonthYear(fileId: any) {
    return this.apiService.get('process/validate/month-year?file_id=' + fileId);
  }
  validateNoBlank(fileId: any) {
    return this.apiService.get('process/validate/no-blank?file_id=' + fileId);
  }
  validateBrand(fileId: any) {
    return this.apiService.get('process/validate/brand?file_id=' + fileId);
  }
  validateDuplicate(fileId: any) {
    return this.apiService.get('process/validate/duplicate?file_id=' + fileId);
  }

  insertData(fileId: any) {
    return this.apiService.get('process/insert/data?file_id=' + fileId);
  }

  getFileLogs(fileId: any){
     return this.apiService.get('process/logs?file_id=' + fileId);
  }
}
