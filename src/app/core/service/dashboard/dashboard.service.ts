import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(private apiService: ApiService) {}

  getClientCounts() {
    return this.apiService.get('dashboard/client/count');
  }

  getUserCounts() {
    return this.apiService.get('dashboard/user/count');
  }

  getStoreCounts() {
    return this.apiService.get('dashboard/store/count');
  }
}
