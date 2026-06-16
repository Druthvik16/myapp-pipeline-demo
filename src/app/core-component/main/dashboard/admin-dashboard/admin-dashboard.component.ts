import { Component } from '@angular/core';
import { routes } from 'src/app/core/core.index';
import { Router } from '@angular/router';
import { DashboardService } from 'src/app/core/service/dashboard/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,

  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent {
  public routes = routes;
  clientCount: any;
  storeCount: any;
  usercount: any;

  dashboardData = [
    {
      id: 1,
      name: 'Clients',
      count: '10',
      route: routes.client,
    },
    {
      id: 2,
      name: 'Customer/Store',
      count: '10',
      route: routes.storeMaster,
    },
    {
      id: 3,
      name: 'Users',
      count: '25',
      route: routes.user,
    },
  ];
  constructor(
    private dashboardService: DashboardService
  ) {}
  ngOnInit(): void {
    this.getClientCount();
    this.getStoreCount();
    this.getUserCount();
  }

  getCardColor(name: string): string {
    switch (name) {
      case 'Clients':
        return 'bg-primary sale-widget flex-fill';
      case 'Customer/Store':
        return 'bg-info sale-widget flex-fill';
      case 'Users':
        return 'bg-teal sale-widget flex-fill';
      default:
        return 'bg-light sale-widget flex-fill'; // fallback
    }
  }

  getIconClass(statusName: string): string {
    switch (statusName) {
      case 'Clients':
        return 'ti ti-briefcase-2';
      case 'Customer/Store':
        return 'ti ti-building-store';
      case 'Users':
        return 'ti ti-users';
      default:
        return 'ti ti-document';
    }
  }

  async getClientCount() {
    try {
      let response = await this.dashboardService.getClientCounts().toPromise();
      if (response) {
        this.clientCount = response.client_count;
      } else {
        this.clientCount = 0;
      }
    } catch (error) {
      this.clientCount = 0;
    }
  }

  async getStoreCount() {
    try {
      let response = await this.dashboardService.getStoreCounts().toPromise();
      if (response) {
        this.storeCount = response.store_count;
      } else {
        this.storeCount = 0;
      }
    } catch (error) {
      this.storeCount = 0;
    }
  }

  async getUserCount() {
    try {
      let response = await this.dashboardService.getUserCounts().toPromise();
      if (response) {
        this.usercount = response.user_count;
      } else {
        this.usercount = 0;
      }
    } catch (error) {
      this.usercount = 0;
    }
  }
}
