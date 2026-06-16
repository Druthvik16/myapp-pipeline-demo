import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';
import { ClientService } from 'src/app/core/service/client/client.service';
import { Router } from '@angular/router';
import { DashboardService } from 'src/app/core/service/dashboard/dashboard.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TrackerService } from 'src/app/core/service/tracker/tracker.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-executive-dashboard',
  standalone: false,
  templateUrl: './executive-dashboard.component.html',
  styleUrl: './executive-dashboard.component.scss',
})
export class ExecutiveDashboardComponent {
  public routes = routes;
  clients: any = [];
  imagePreviewMap: { [key: string]: string } = {};
  expandedClients: Set<number> = new Set();
  dynamicStateTitles: string[] = [];
  clientStateMap: { [clientId: string]: { [state: string]: number } | undefined } = {};
  selectedClient: any = null;
  @ViewChild('clientInfoModal') clientInfoModal: any;
  readonly mandatoryStates = [
    'unformatted',
    'formatted',
    'approval-pending',
    'approved',
    'duplicate',
    'uploaded',
    'rejected'
  ];

  constructor(
    private clientService: ClientService,
    private cdRef: ChangeDetectorRef,
    private router: Router,
    private dashboardService: DashboardService,
    private modalService: NgbModal,
    private trackerService: TrackerService,
  ) {}

  ngOnInit() {
    this.getClients();
    this.getClientFileCounts();
  }

  async getClients() {
    try {
      let response = await this.clientService.getClients().toPromise();
      if (response) {
        this.clients = response;
        for (let client of this.clients) {
          if (client.profile_logo_url) {
            this.loadClientImagePreview(client.id, client.profile_logo_url);
          }
        }
      }
    } catch (error) {
      this.clients = [];
    }
  }

  async loadClientImagePreview(id: number, url: string) {
    try {
      const payload = { file: url };
      const response = await this.clientService
        .getImageUrl(payload)
        .toPromise();
      if (response?.url) {
        this.imagePreviewMap[id] = response.url;
        this.cdRef.detectChanges();
      }
    } catch (err) {}
  }

  async getClientFileCounts() {
    try {
      const response: any[] = await this.dashboardService
        .getClientCounts()
        .toPromise();
      if (response) {
        const stateSet = new Set<string>();
        response.forEach((item) => stateSet.add(item.state_name));
        this.dynamicStateTitles = Array.from(stateSet);
        for (const item of response) {
          const clientId = item.client_id;
          const state = item.state_name;
          const count = item.file_count;
          if (!this.clientStateMap[clientId]) {
            this.clientStateMap[clientId] = {};
          }
          this.clientStateMap[clientId][state] = count;
        }
        for (const client of this.clients) {
          const clientId = client.id;
          if (!this.clientStateMap[clientId]) {
            this.clientStateMap[clientId] = {};
          }
          for (const state of this.dynamicStateTitles) {
            if (!(state in this.clientStateMap[clientId])) {
              this.clientStateMap[clientId][state] = 0;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading file counts', error);
    }
  }

  async openClientInfoModal(client: any) {
    this.selectedClient = client;
    if (this.dynamicStateTitles.length === 0) {
      await this.getClientFileCounts();
    }
    this.modalService.open(this.clientInfoModal, {
      backdrop: 'static',
      size: 'sm',
      centered: true,
    });
  }

  isEmptyStateMap(clientId: number): boolean {
    const map = this.clientStateMap[clientId];
    if (!map) return true;
    return Object.keys(map).length === 0;
  }

  goToUnformatted(uuid: string) {
    this.router.navigate([routes.unformatted], {
      queryParams: { client_uuid: uuid },
    });
  }

  downloadStateFile(state: string) {
    try {
      this.trackerService.getFileTracker(state, this.selectedClient.uuid).subscribe((res: any) => {
        const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.selectedClient?.name || 'file'}-${state}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error?.message || 'Something went wrong!',
      });
      console.error('Error downloading file', error);
    }
  }
}
