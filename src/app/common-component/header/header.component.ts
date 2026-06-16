import { ChangeDetectorRef, Component } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, Event as RouterEvent } from '@angular/router';
import { CommonService, SidebarService } from 'src/app/core/core.index';
import { WebstorgeService } from 'src/app/shared/webstorge.service';
import { routes } from 'src/app/core/helpers/routes';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import { ClientService } from 'src/app/core/service/client/client.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent {
  public routes = routes;
  inputValue = '';
  activePath = '';
  showSearch = false;
  public changeLayout = '1';
  public darkTheme = false;
  public logoPath = '';
  public miniSidebar = false;
  elem = document.documentElement;
  public addClass = false;
  base = '';
  page = '';
  last = '';
  userData: any;
  userTypeCode!: string;
  financialYear: string = '';
  clients: any = [];
  clientUUID!: string;
  selectedClientName: string = '';
  imagePreviewMap: { [key: string]: string } = {};
  selectedClientId: any
  menuValue: string = '';
  isDashboardRoute: boolean = false

  constructor(
    private Router: Router,
    private common: CommonService,
    private sidebar: SidebarService,
    private webStorage: WebstorgeService,
    public router: Router,
    private commonSharedService: CommonSharedService,
    private clientService: ClientService,
    private cdRef: ChangeDetectorRef
  ) {
    this.activePath = this.Router.url.split('/')[2];
    this.Router.events.subscribe((data: RouterEvent) => {
      if (data instanceof NavigationStart) {
        this.activePath = data.url.split('/')[2];
      }
    });
    this.sidebar.sideBarPosition.subscribe((res: string) => {
      if (res == 'true') {
        this.miniSidebar = true;
      } else {
        this.miniSidebar = false;
      }
    });
    this.common.base.subscribe((base: string) => {
      this.base = base;
    });
    this.common.page.subscribe((page: string) => {
      this.page = page;
    });
    this.common.last.subscribe((last: string) => {
      this.last = last;
    });
  }

  ngOnInit() {
    this.userData = JSON.parse(sessionStorage.getItem('LOGINUSER') || '{}');
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isDashboardRoute = event.url.includes('/dashboard') || event.url.includes('/clients');
    });
    this.isDashboardRoute = this.router.url.includes('/dashboard') || this.router.url.includes('/clients');

    this.setFinancialYear();
    this.getClients();
  }

  setFinancialYear() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    if (month >= 4) {
      this.financialYear = `${year}-${year + 1}`;
    } else {
      this.financialYear = `${year - 1}-${year}`;
    }
  }

  public logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate([routes.signIn]);
  }

  async getClients() {
    try {
      let response = await this.clientService.getClients().toPromise();
      if (response) {
        this.clients = response;
        this.clients.unshift({ uuid: '', name: 'All Clients' });
        if (this.clients.length > 1) {
          const client1 = this.clients[1];
          if (client1 && client1.uuid) {
            this.getSelectedClientADM(new Event('click'), client1);
          }
        }
      }
    } catch (error) {
      this.clients = [];
      this.clients.unshift({ uuid: '', name: 'All Clients' });
    }
  }

  getSelectedClientADM(event: any, client: any) {
    event.preventDefault();
    const uuid = client.uuid;
    this.clientUUID = uuid;
    this.selectedClientName = client.name;
    this.selectedClientId = client.id;

    if (!uuid) {
      this.selectedClientName = '';
      this.selectedClientId = null;
      this.clientUUID = '';
    }
    else if (client.profile_logo_url) {
      this.loadClientImagePreview(client.id, client.profile_logo_url);
    }

    this.commonSharedService.selectedClientUUID.next({
      result: true,
      uuid: this.clientUUID,
    });
  }

  async loadClientImagePreview(id: number, url: string) {
    try {
      const payload = { file: url };
      const response = await this.clientService.getImageUrl(payload).toPromise();
      if (response?.url) {
        this.imagePreviewMap[id] = response.url;
        this.cdRef.detectChanges();
      }
    } catch (err) {
    }
  }

  public toggleSidebar(): void {
    this.sidebar.switchSideMenuPosition();
  }

  public togglesMobileSideBar(): void {
    this.sidebar.switchMobileSideBarPosition();
  }

  public miniSideBarMouseHover(position: string): void {
    if (position == 'over') {
      this.sidebar.expandSideBar.next(true);
    } else {
      this.sidebar.expandSideBar.next(false);
    }
  }

  fullscreen() {
    if (!document.fullscreenElement) {
      this.elem.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  evaluate(expression: string): string {
    try {
      return new Function('return ' + expression)();
    } catch {
      return 'Error';
    }
  }

  clearCal(): string {
    return '';
  }

  backspacemain(value: string): string {
    return value.slice(0, -1);
  }
  onKeyPress(event: KeyboardEvent) {
    const validKeys = /[0-9+\-*/%.]/;

    if (validKeys.test(event.key)) {
      this.inputValue += event.key;
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      this.inputValue = this.backspacemain(this.inputValue);
    } else if (event.key === 'Enter') {
      this.solve();
    } else if (event.key.toLowerCase() === 'c') {
      this.clear();
    }
  }

  solve(): void {
    this.inputValue = this.evaluate(this.inputValue);
  }

  clear(): void {
    this.inputValue = this.clearCal();
  }

  backspace(): void {
    this.inputValue = this.backspacemain(this.inputValue);
  }

  addValue(val: string): void {
    this.inputValue += val;
  }
}
