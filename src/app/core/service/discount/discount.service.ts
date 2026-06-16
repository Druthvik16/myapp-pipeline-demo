import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DiscountService {
  constructor(private http: HttpClient) {}
  private baseUrl = environment.apiUrl + '/api/';

  getDiscounts(clientUuid: string): any {
    return this.http.get(this.baseUrl + 'batch/list?client_uuid=' + clientUuid);
  }

  createDiscountBatch(payload: any): any {
    return this.http.post(this.baseUrl + 'batch/create', payload);
  }
  getDiscountBatchDetails(batchId: number): any {
    return this.http.get(this.baseUrl + 'batch/details/' + batchId);
  }

  downloadDiscountBatch(batchId: number): any {
    return this.http.get(this.baseUrl + 'batch/download/' + batchId, { responseType: 'blob' });
  }

  getDiscountBatchLogs(batchId: number): any {
    return this.http.get(this.baseUrl + 'batch/logs/' + batchId);
  }
}
