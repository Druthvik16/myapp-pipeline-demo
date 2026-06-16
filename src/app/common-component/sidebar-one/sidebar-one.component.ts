import { Component } from '@angular/core';
import { SidebarService, routes } from 'src/app/core/core.index';
import { NavigationEnd, Router, Event as RouterEvent } from '@angular/router';
import { url } from 'src/app/shared/model/sidebar.model';

interface MenuItem {
  menuValue: string;
  showSubRoute: boolean;
  menu: SubMenu[];
}

interface SubMenu {
  menuValue: string;
  showSubRoute: boolean;
}


@Component({
    selector: 'app-sidebar-one',
    templateUrl: './sidebar-one.component.html',
    styleUrls: ['./sidebar-one.component.scss'],
    standalone: false
})
export class SidebarOneComponent {
  public routes = routes;
  base = '';
  page = '';
  currentUrl = '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public side_bar_data: Array<any> = [];
  logoRoute: string = '';

  constructor(
    private Router: Router,
    private sidebar: SidebarService,
    private router: Router
  ) {
    router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationEnd) {
        this.getRoutes(event);
        this.checkAndClearNestedSubmenu();
      }
    });
    this.getRoutes(this.router);
    // this.side_bar_data = this.sidebar.sidebarData1;
  }

  ngOnInit() {
  this.side_bar_data = this.sidebar.sidebarData1; // read freshly loaded sidebar
  this.logoRoute = this.sidebar.getDashboardRouteForUser();
}

  private getRoutes(route: url): void {
    const splitVal = route.url.split('/');
    this.currentUrl = route.url;
    this.base = splitVal[1];
    this.page = splitVal[2];
  }

  public miniSideBarMouseHover(position: string): void {
    if (position == 'over') {
      this.sidebar.expandSideBar.next(true);
    } else {
      this.sidebar.expandSideBar.next(false);
    }
  }

  // expandSubMenus(menu: MenuItem): void {
  //   sessionStorage.setItem('menuValue', menu.menuValue);
  //   this.side_bar_data.forEach((mainMenus: MenuItem) => {
  //     mainMenus.menu.forEach((resMenu: SubMenu) => {
  //       if (resMenu.menuValue === menu.menuValue) {
  //         menu.showSubRoute = !menu.showSubRoute;
  //       } else {
  //         resMenu.showSubRoute = false;
  //       }
  //     });
  //   });
  // }

  // expandSubMenus(menu: MenuItem): void {
  //   this.side_bar_data.forEach((mainMenus: MenuItem) => {
  //     mainMenus.menu.forEach((resMenu: SubMenu) => {
  //       if (resMenu.menuValue === menu.menuValue) {
  //         menu.showSubRoute = !menu.showSubRoute;
  //         this.openMenuItem = null;
  //         if (!menu.showSubRoute) {
  //         this.openSubmenuOneItem = null;
  //       }
  //       } else {
  //         resMenu.showSubRoute = false;
  //         this.openSubmenuOneItem = null;
  //       }
  //     });
  //   });
  // }


  expandSubMenus(menu: any): void {
  this.side_bar_data.forEach((mainMenus: any) => {
    mainMenus.menu.forEach((resMenu: any) => {
      if (resMenu.menuValue === menu.menuValue) {
        menu.showSubRoute = !menu.showSubRoute;
        this.openMenuItem = null;
        
        if (!menu.showSubRoute) {
          this.openSubmenuOneItem = null;
        }
      } else {
        resMenu.showSubRoute = false;
      }
    });
  });
}

// Add this method
private checkAndClearNestedSubmenu(): void {
  let isOnNestedRoute = false;
  this.side_bar_data.forEach((mainMenus: any) => {
    mainMenus.menu?.forEach((menu: any) => {
      menu.subMenus?.forEach((subMenu: any) => {
        if (subMenu.subMenusTwo) {
          subMenu.subMenusTwo.forEach((child: any) => {
            if (child.route && this.currentUrl.includes(child.route)) {
              isOnNestedRoute = true;
            }
          });
        }
      });
    });
  });
  
  if (!isOnNestedRoute) {
    this.openSubmenuOneItem = null;
  }
}


  openMenuItem: MenuItem | null = null;
  openSubmenuOneItem: SubMenu[] | null = null;
  multiLevel1 = false;
  multiLevel2 = false;
  multiLevel3 = false;

  openMenu(menu: MenuItem): void {
    if (this.openMenuItem === menu) {
      this.openMenuItem = null;
    } else {
      this.openMenuItem = menu;
      menu.showSubRoute = false;
    }
  }
  
  openSubmenuOne(subMenus: SubMenu[]): void {
    if (this.openSubmenuOneItem === subMenus) {
      this.openSubmenuOneItem = null;
    } else {
      this.openSubmenuOneItem = subMenus;
    }
  }

  multiLevelOne() {
    this.multiLevel1 = !this.multiLevel1;
  }
  multiLevelTwo() {
    this.multiLevel2 = !this.multiLevel2;
  }
  multiLevelThree() {
    this.multiLevel3 = !this.multiLevel3;
  }
  public toggleSidebar(): void {
    this.sidebar.switchSideMenuPosition();
  }
  
}
