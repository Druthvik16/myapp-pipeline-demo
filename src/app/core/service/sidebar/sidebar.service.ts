import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { routes } from '../../core.index';
import { SideBar, SideBarMenu } from 'src/app/shared/model/page.model';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  public sidebarData1: any[] = [];

  constructor() {
    this.loadSidebarBasedOnRole();
  }

  loadSidebarBasedOnRole() {
    const user = JSON.parse(sessionStorage.getItem('LOGINUSER') || '{}');
    if (!user.user) {
      this.sidebarData1 = [];
      return;
    }
    if (user.user.user_type === 'Admin') {
      this.sidebarData1 = this.getAdminSidebar();
    } else if (user.user.user_type === 'Executive') {
      this.sidebarData1 = this.getExecutiveSidebar();
    } else if (user.user.user_type === 'Team Lead') {
      this.sidebarData1 = this.getTeamSidebar();
    }
  }
  private collapseSubject = new BehaviorSubject<boolean>(false);
  collapse$ = this.collapseSubject.asObservable();

  toggleCollapse() {
    this.collapseSubject.next(!this.collapseSubject.value);
  }

  public sideBarPosition: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('sideBarPosition') || 'false'
  );

  public toggleMobileSideBar: BehaviorSubject<string> =
    new BehaviorSubject<string>(
      localStorage.getItem('isMobileSidebar') || 'false'
    );

  public expandSideBar: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

  public switchSideMenuPosition(): void {
    if (localStorage.getItem('sideBarPosition')) {
      this.sideBarPosition.next('false');
      this.expandSideBar.next(true);
      localStorage.removeItem('sideBarPosition');
    } else {
      this.sideBarPosition.next('true');
      this.expandSideBar.next(false);
      localStorage.setItem('sideBarPosition', 'true');
    }
  }

  public switchMobileSideBarPosition(): void {
    if (localStorage.getItem('isMobileSidebar')) {
      this.toggleMobileSideBar.next('false');
      localStorage.removeItem('isMobileSidebar');
    } else {
      this.toggleMobileSideBar.next('true');
      localStorage.setItem('isMobileSidebar', 'true');
    }
  }

  getDashboardRouteForUser(): string {
  const user = JSON.parse(sessionStorage.getItem('LOGINUSER') || '{}');

  if (!user?.user) return routes.signIn;

  switch (user.user.user_type) {
    case 'Admin':
      return routes.index;
    case 'Executive':
      return routes.executiveDashboad; 
    case 'Team Lead':
      return routes.preApproval;
    default:
      return routes.signIn;
  }
}

  private getAdminSidebar(): any[] {
  return [
    {
      tittle: 'Main',
      active: false,
      showAsTab: false,
      separateRoute: false,
      hasSubRoute: false,
      showSubRoute: true,
      menu: [
        {
          menuValue: 'Dashboard',
          hasSubRoute: false,
          showSubRoute: false,
          icon2: 'layout-grid',
          base: 'dashboard',
          route: routes.index,
          activeMenu: '',
        },
        {
          menuValue: 'Clients',
          hasSubRoute: false,
          showSubRoute: false,
          icon2: 'briefcase-2',
          base: 'client',
          route: routes.client,
          activeMenu: '',
        },
         {
          menuValue: 'Masters',
          icon2: 'settings',
          base: 'master',
          hasSubRouteTwo: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Store Master',
              route: routes.storeMaster,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Header Master',
              route: routes.HeaderMaster,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Reason Master',
              route: routes.reasonsMaster,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Product Master',
              page1: 'header-mapping',
              customSubmenuTwo: true,
              hasSubRoute: false,
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'Header Mapping',
                  route: routes.productHeaderMapping,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Lists',
                  route: routes.productLists,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
          ],
        },
        {
          menuValue: 'Users',
          hasSubRoute: false,
          showSubRoute: false,
          icon2: 'user',
          base: 'user',
          route: routes.user,
          activeMenu: '',
        },
        {
          menuValue: 'Staffs',
          hasSubRoute: false,
          showSubRoute: false,
          icon2: 'user-square-rounded',
          base: 'staff',
          route: routes.staff,
          activeMenu: '',
        },
        {
          menuValue: 'Buckets',
          icon2: 'folders',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'bucket',
          subMenus: [
            {
              menuValue: 'Unformatted',
              route: routes.unformatted,
            },
            {
              menuValue: 'Formatted',
              route: routes.formatted,
            },
            {
              menuValue: 'Approved',
              route: routes.approved,
            },
            {
              menuValue: 'Uploaded',
              route: routes.uploaded,
            },
            {
              menuValue: 'Rejected',
              route: routes.rejected,
            },
            {
              menuValue: 'Deleted',
              route: routes.deleted,
            },
          ],
        },
        {
          menuValue: 'Pre-Approval',
          icon2: 'device-ipad-check',
          hasSubRoute: false,
          showSubRoute: false,
          base: 'pre-approval',
          activeMenu: '',
          route: routes.preApproval,
        },
        {
          menuValue: 'Reverification',
          icon2: 'copy-check',
          hasSubRoute: false,
          showSubRoute: false,
          base: 'reverification',
          activeMenu: '',
          route: routes.reverification,
        },
        {
          menuValue: 'Uploaded-Data',
          hasSubRoute: false,
          showSubRoute: false,
          base: 'uploaded-data',
          route: routes.uploadedData,
          activeMenu: '',
          icon2: 'file-upload',
        },
        {
          menuValue: 'Discount Bucket',
          route: routes.discountBucket,
          hasSubRoute: false,
          showSubRoute: false,
          base: 'discount-bucket',
          icon2: 'files',
          activeMenu: '',
        },
        {
          menuValue: 'Tracker',
          route: routes.tracker,
          hasSubRoute: false,
          showSubRoute: false,
          base: 'tracker',
          icon2: 'timeline',
          activeMenu: '',
        },
        {
          menuValue: 'Reports',
          icon2: 'report',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'reports',
          subMenus: [
            {
              menuValue: 'Bot Report',
              route: routes.botTracker,
            },
            {
              menuValue: 'File Report',
              route: routes.fileLevelTracker,
            },
            {
              menuValue: 'Final Report',
              route: routes.finalDataTracker,
            },
          ],
        },
      ],
    },
  ];
}

  private getExecutiveSidebar(): any[] {
    return [
      {
        tittle: 'Main',
        showAsTab: true,
        separateRoute: false,
        hasSubRoute: false,
        showSubRoute: true,
        menu: [
          {
            menuValue: 'Dashboard',
            hasSubRoute: false,
            showSubRoute: false,
            base1: 'dashboard',
            route: routes.executiveDashboad,
            activeMenu: '',
            icon2: 'layout-grid',
          },
          {
            menuValue: 'Bucket',
            icon2: 'folders',
            hasSubRoute: true,
            showSubRoute: false,
            subMenus: [
               {
                menuValue: 'Unformatted',
                route: routes.unformatted,
              },
              {
                menuValue: 'Formatted',
                route: routes.formatted,
              },
              {
                menuValue: 'Approved',
                route: routes.approved,
              },
              {
                menuValue: 'Uploaded',
                route: routes.uploaded,
              },
              {
                menuValue: 'Rejected',
                route: routes.rejected,
              },
              {
                menuValue: 'Deleted',
                route: routes.deleted,
              },

            ],
          },
          {
            menuValue: 'Uploaded-Data',
            hasSubRoute: false,
            showSubRoute: false,
            route: routes.uploadedData,
            activeMenu: '',
            icon2: 'file-upload',
          },
          {
            menuValue: 'Discount Bucket',
            route: routes.discountBucket,
            hasSubRoute: false,
            showSubRoute: false,
            icon2: 'files',
            activeMenu: '',
          },
          {
            menuValue: 'Tracker',
            route: routes.tracker,
            hasSubRoute: false,
            showSubRoute: false,
            icon2: 'ti ti-timeline',
            activeMenu: '',
          },
          {
            menuValue: 'Reports',
            icon2: 'report',
            hasSubRoute: true,
            showSubRoute: false,
            subMenus: [
               {
            menuValue: 'Bot Report',
            route: routes.botTracker,
          },
          {
            menuValue: 'File Report',
            route: routes.fileLevelTracker,
          },
          {
            menuValue: 'Final Report',
            route: routes.finalDataTracker,
          },
            ]
          },
        ],
      },
    ];
  }

  private getTeamSidebar(): any[] {
    return [
      {
        tittle: 'Main',
        active: false,
        showAsTab: false,
        separateRoute: false,
        hasSubRoute: true,
        showSubRoute: true,
        menu: [
          {
            menuValue: 'Pre-Approval',
            icon2: 'device-ipad-check',
            hasSubRoute: false,
            showSubRoute: false,
            activeMenu: '',
            route: routes.preApproval,
          },
          {
            menuValue: 'Reverification',
            icon2: 'copy-check',
            hasSubRoute: false,
            showSubRoute: false,
            activeMenu: '',
            route: routes.reverification,
          },
           {
            menuValue: 'Bucket',
            icon2: 'folders',
            hasSubRoute: true,
            showSubRoute: false,
            subMenus: [
               {
                menuValue: 'Unformatted',
                route: routes.unformatted,
              },
              {
                menuValue: 'Formatted',
                route: routes.formatted,
              },
              {
                menuValue: 'Approved',
                route: routes.approved,
              },
              {
                menuValue: 'Uploaded',
                route: routes.uploaded,
              },
              {
                menuValue: 'Rejected',
                route: routes.rejected,
              },
              {
                menuValue: 'Deleted',
                route: routes.deleted,
              },

            ],
          },
          {
            menuValue: 'Uploaded-Data',
            hasSubRoute: false,
            showSubRoute: false,
            route: routes.uploadedData,
            activeMenu: '',
            icon2: 'file-upload',
          },
          {
            menuValue: 'Discount Bucket',
            route: routes.discountBucket,
            hasSubRoute: false,
            showSubRoute: false,
            icon2: 'files',
            activeMenu: '',
          },
          {
            menuValue: 'Tracker',
            route: routes.tracker,
            hasSubRoute: false,
            showSubRoute: false,
            icon2: 'ti ti-timeline',
            activeMenu: '',
          },
          {
            menuValue: 'Reports',
            icon2: 'report',
            hasSubRoute: true,
            showSubRoute: false,
            subMenus: [
               {
            menuValue: 'Bot Report',
            route: routes.botTracker,
          },
          {
            menuValue: 'File Report',
            route: routes.fileLevelTracker,
          },
          {
            menuValue: 'Final Report',
            route: routes.finalDataTracker,
          },
            ]
          },
        ],
      },
    ];
  }

  // public sidebarData1 = [
  //   {
  //     tittle: 'Main',
  //     active: false,
  //     showAsTab: false,
  //     separateRoute: false,
  //     hasSubRoute: false,
  //     showSubRoute: true,
  //     menu: [
  //       {
  //         menuValue: 'Dashboard',
  //         hasSubRoute: false,
  //         showSubRoute: false,
  //         icon2: 'layout-grid',
  //         base1: 'dashboard',
  //         route: routes.index,
  //         activeMenu:''
  //       },
  //        {
  //         menuValue: 'Clients',
  //         hasSubRoute: false,
  //         showSubRoute: false,
  //         icon2: 'briefcase-2',
  //         base1: 'dashboard',
  //         route: routes.client,
  //         activeMenu:''
  //       },
  //       {
  //         menuValue: 'Store Master',
  //         hasSubRoute: false,
  //         showSubRoute: false,
  //         icon2: 'building-store',
  //         base1: 'dashboard',
  //         route: routes.storeMaster,
  //         activeMenu:''
  //       },
  //        {
  //         menuValue: 'Header Master',
  //         hasSubRoute: false,
  //         showSubRoute: false,
  //         icon2: 'table',
  //         base1: 'dashboard',
  //         route: routes.HeaderMaster,
  //         activeMenu:''
  //       },
  //        {
  //         menuValue: 'User',
  //         hasSubRoute: false,
  //         showSubRoute: false,
  //         icon2: 'user',
  //         base1: 'dashboard',
  //         route: routes.user,
  //         activeMenu:''
  //       },
  //                {
  //         menuValue: 'Staff',
  //         hasSubRoute: false,
  //         showSubRoute: false,
  //         icon2: 'user-square-rounded',
  //         base1: 'dashboard',
  //         route: routes.staff,
  //         activeMenu:''
  //       },
  //     ],
  //   },
  // ];

  public sidebarData2: SideBar[] = [
    {
      tittle: 'Main',
      icon: 'airplay',
      showAsTab: true,
      showMyTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Dashboard',
          route: routes.index,
          hasSubRoute: true,
          showSubRoute: false,
          icon: 'smart-home',
          base: 'dashboard',
          materialicons: 'home',
          subMenus: [
            {
              menuValue: 'Admin Dashboard',
              route: routes.index,
              base: 'index',
            },
          ],
        },
        {
          menuValue: 'Application',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'layout-grid-add',
          base: 'application',
          materialicons: 'dashboard',
          subMenus: [],
        },
      ],
    },
    {
      tittle: 'Layout',
      icon: 'file',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Layouts',
          hasSubRoute: true,
          showSubRoute: false,
          icon: 'layout-board-split',
          base: 'layout-horizontal',
          base2: 'layout-two-column',
          materialicons: 'home',
          subMenus: [
            {
              menuValue: 'Horizontal',
              route: routes.Horizontal,
              hasSubRoute: false,
              showSubRoute: false,
              base: 'layout-horizontal',
            },
            {
              menuValue: 'Detached',
              route: routes.Detached,
              hasSubRoute: false,
              showSubRoute: false,
              base: 'crm',
            },
            {
              menuValue: 'Two Column',
              route: routes.TwoColumn,
              hasSubRoute: false,
              showSubRoute: false,
              base: 'layout-two-column',
            },
            {
              menuValue: 'Boxed',
              route: routes.Boxed,
              hasSubRoute: false,
              showSubRoute: false,
              base: 'crm',
            },
            {
              menuValue: 'RTL',
              route: routes.RTL,
              hasSubRoute: false,
              showSubRoute: false,
              base: 'crm',
            },
            {
              menuValue: 'Dark',
              route: routes.Dark,
              hasSubRoute: false,
              showSubRoute: false,
              base: 'crm',
            },
          ],
        },
      ],
    },
    {
      tittle: 'Inventory',
      icon: 'layers',
      showAsTab: false,
      separateRoute: false,
      base: 'projects',
      menu: [
        {
          menuValue: 'Inventory',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'table-plus',
          base: 'product-list',
          base2: 'add-product',
          materialicons: 'dashboard',
          subMenus: [],
        },
      ],
    },
    {
      tittle: 'Stock',
      icon: 'layers',
      showAsTab: false,
      separateRoute: false,
      base: 'projects',
      menu: [
        {
          menuValue: 'Stock',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'stack-3',
          base: 'inventory',
          base2: 'projects',
          materialicons: 'dashboard',
          subMenus: [],
        },
      ],
    },
    {
      tittle: 'Sales',
      icon: 'file',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Sales',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'device-laptop',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Sales',
              hasSubRoute: true,
              customSubmenuTwo: true,
              showSubRoute: false,
              subMenusTwo: [],
            },
          ],
        },
      ],
    },

    {
      tittle: 'Finance & Accounts',
      icon: 'file',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Finance & Accounts',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'shopping-cart-dollar',
          base: 'sales',
          base2: 'accounting',
          base3: 'payroll',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Expenses',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [],
            },
            {
              menuValue: 'Income',
              base: 'income',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [],
            },
          ],
        },
      ],
    },
    {
      tittle: 'Hrm',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Hrm',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'cash',
          base: 'assets',
          base2: 'support',
          base3: 'user-management',
          base4: 'reports',
          base5: 'settings',
          materialicons: 'dashboard',
          subMenus: [],
        },
      ],
    },
    {
      tittle: 'Pages',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Pages',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'page-break',
          base: 'starter',
          base2: 'profile',
          base3: 'gallery',
          base4: 'search-result',
          base5: 'timeline',
          base7: 'pricing',
          base8: 'api-keys',
          base9: 'privacy-policy',
          base10: 'terms-condition',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Blog',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [],
            },
            {
              menuValue: 'Location',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [],
            },
            {
              menuValue: 'Authentication',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Login',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.signIn,
                },
                {
                  menuValue: 'Reset Password',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.resetPassword,
                },
                {
                  menuValue: 'Lock Screen',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.signIn,
                },
              ],
            },
            {
              menuValue: 'Error Pages',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Error 404',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.error404,
                },
              ],
            },
          ],
        },
      ],
    },

    {
      tittle: 'Settings',
      icon: 'file',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Settings',
          route: '',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'lock-check',
          base: 'base-ui',
          base2: 'advanced-ui',
          base3: 'charts',
          base4: 'icon',
          base5: 'forms',
          base7: 'table',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Other Settings',
              customSubmenuTwo: true,
              base: 'other-settings',
              subMenusTwo: [],
            },
            {
              menuValue: 'Logout',
              customSubmenuTwo: false,
              base: 'logout',
              route: routes.signIn,
            },
          ],
        },
      ],
    },
    {
      tittle: 'Extras',
      icon: 'file',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Extras',
          route: '',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'vector-triangle',
          base: 'apps',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Documentation',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
              base: '1',
            },
            {
              menuValue: 'Change Log',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
              base: '1',
            },
          ],
        },
      ],
    },
  ];
  public getSideBarData2: BehaviorSubject<SideBar[]> = new BehaviorSubject<
    SideBar[]
  >(this.sidebarData2);
  public resetData2(): void {
    this.sidebarData2.map((res: SideBar) => {
      res.showAsTab = false;
      res.menu.map((menus: SideBarMenu) => {
        menus.showSubRoute = false;
      });
    });
  }
  public sidebarData3 = [
    {
      tittle: 'Main Menu',
      hasSubRoute: true,
      icon: 'layout-grid',
      showSubRoute: false,
      subRoutes: [
        {
          tittle: 'Dashboard',
          hasSubRoute: true,
          showSubRoute: true,
          route: routes.dashboard,
          subRoutes: [
            {
              tittle: 'Admin Dashboard',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.index,
              customSubmenuTwo: false,
              subRoutes: [],
            },
          ],
        },
        {
          tittle: 'Super Admin',
          hasSubRoute: true,
          showSubRoute: true,
          route: routes.dashboard,
          subRoutes: [
            {
              tittle: 'Dashboard',
              hasSubRoute: false,
              showSubRoute: false,
              route: '/supeadmin',
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Companies',
              hasSubRoute: false,
              showSubRoute: false,
              route: '/admin2',
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Subcriptions',
              hasSubRoute: false,
              showSubRoute: false,
              route: '/supeadmin',
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Packages',
              hasSubRoute: false,
              showSubRoute: false,
              route: '/supeadmin',
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Domain',
              hasSubRoute: false,
              showSubRoute: false,
              route: '/supeadmin',
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Purchase Transcation',
              hasSubRoute: false,
              showSubRoute: false,
              route: '/supeadmin',
              customSubmenuTwo: false,
              subRoutes: [],
            },
          ],
        },
        {
          tittle: 'Application',
          hasSubRoute: true,
          showSubRoute: true,
          base: 'application',
          subRoutes: [
            {
              tittle: 'Call',
              hasSubRoute: true,
              showSubRoute: false,
              base: 'application',
              customSubmenuTwo: true,
              subMenusTwo: [],
            },
            {
              tittle: 'Products',
              hasSubRoute: false,
              showSubRoute: false,
              route: '/appli',
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Ecommerce',
              hasSubRoute: true,
              showSubRoute: true,
              base: 'ecommerce',
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Products',
                  route: '/ecommerce',
                  hasSubRoute: false,
                  showSubRoute: false,
                  subRoutes: [],
                },
                {
                  tittle: 'Orders',
                  route: '/orde',
                  hasSubRoute: false,
                  showSubRoute: false,
                },

                {
                  tittle: 'Customers',
                  route: '/ecommer',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Cart',
                  route: '/ecommer',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Checkout',
                  route: '/ecommer',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Wishlist',
                  route: '/ecommer',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Reviews',
                  route: '/ecommer',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
          ],
        },
        {
          tittle: 'Layouts',
          hasSubRoute: true,
          showSubRoute: true,
          activeRoute: 'layot',
          subRoutes: [
            {
              tittle: 'Horizontal',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.Horizontal,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Detached',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.Detached,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Two Column',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.TwoColumn,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Boxed',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.Boxed,
              customSubmenuTwo: false,
            },
            {
              tittle: 'RTL',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.RTL,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Dark',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.Dark,
              customSubmenuTwo: false,
            },
          ],
        },
      ],
    },
    {
      tittle: 'Inventory',
      hasSubRoute: true,
      icon: 'brand-unity',
      showSubRoute: false,
      activeRoute: 'product',
      subRoutes: [],
    },
    {
      tittle: 'Sales & Purchase',
      hasSubRoute: true,
      icon: 'layout-grid',
      showSubRoute: false,
      subRoutes: [
        {
          tittle: 'Income',
          hasSubRoute: true,
          showSubRoute: false,
          subRoutes: [],
        },
      ],
    },

    {
      tittle: 'Pages',
      hasSubRoute: true,
      icon: 'page-break',
      showSubRoute: false,
      subRoutes: [
        {
          tittle: 'Authentication',
          hasSubRoute: true,
          showSubRoute: false,
          subRoutes: [
            {
              tittle: 'Login',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Cover',
                  route: routes.signIn,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Illustration',
                  route: routes.signIn2,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Basic',
                  route: routes.signIn3,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
          ],
        },
        {
          tittle: 'Error',
          hasSubRoute: true,
          showSubRoute: false,
          route: '/error',
          subRoutes: [
            {
              tittle: '404 Error',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.error404,
              customSubmenuTwo: false,
              subRoutes: [],
            },
          ],
        },
        {
          tittle: 'Content',
          hasSubRoute: true,
          showSubRoute: false,
          subRoutes: [
            {
              tittle: 'Pages',
              hasSubRoute: true,
              showSubRoute: false,

              customSubmenuTwo: true,
              subMenusTwo: [],
            },
            {
              tittle: 'Blogs',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [],
            },
            {
              tittle: 'Location',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [],
            },
          ],
        },
        {
          tittle: 'Employees',
          hasSubRoute: true,
          showSubRoute: false,
          subRoutes: [],
        },
        {
          tittle: 'Attendance',
          hasSubRoute: true,
          showSubRoute: false,
          route: '/atte',
          subRoutes: [],
        },
        {
          tittle: 'Leaves & Holidays',
          hasSubRoute: true,
          showSubRoute: false,
          route: '/atte',
          subRoutes: [],
        },
        {
          tittle: 'Payroll',
          hasSubRoute: true,
          showSubRoute: false,
          route: '/atte',
          subRoutes: [],
        },
      ],
    },
    {
      tittle: 'Settings',
      hasSubRoute: true,
      icon: 'settings',
      showSubRoute: false,
      activeRoute: 'users',
      subRoutes: [
        {
          tittle: 'App Settings',
          hasSubRoute: true,
          icon: 'assets/img/icons/printer.svg',
          showSubRoute: false,
          activeRoute: 'users',
          subRoutes: [],
        },
        {
          tittle: 'Financial Settings',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'users',
          subRoutes: [],
        },
        {
          tittle: 'Other Settings',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'users',
          subRoutes: [],
        },
        {
          tittle: 'Documentation',
          hasSubRoute: false,
          showSubRoute: false,
          activeRoute: 'users',
        },
        {
          tittle: 'Changelog v2.0.7',
          hasSubRoute: false,
          showSubRoute: false,
          activeRoute: 'users',
        },
      ],
    },
    {
      tittle: 'More',
      hasSubRoute: true,
      icon: 'circle-plus',
      showSubRoute: false,
      activeRoute: 'users',
      subRoutes: [
        {
          tittle: 'People',
          hasSubRoute: true,
          showSubRoute: false,
          subRoutes: [],
        },
      ],
    },
  ];

  public settings_sidebar = [
    {
      icon: 'ti ti-settings',
      title: 'General Settings',
      page: 'general-settings',
      expanded: false,
      subMenu: [],
    },
    {
      icon: 'ti ti-world',
      title: 'Website Settings',
      page: 'website-settings',
      expanded: false,
      subMenu: [],
    },
    {
      icon: 'ti ti-device-mobile',
      title: 'App Settings',
      page: 'app-settings',
      expanded: false,
      subMenu: [],
    },
    {
      icon: 'ti ti-device-desktop',
      title: 'System Settings',
      page: 'system-settings',
      expanded: false,
      subMenu: [],
    },
    {
      icon: 'ti ti-settings-dollar',
      title: 'Financial Settings',
      page: 'financial-settings',
      expanded: false,
      subMenu: [],
    },
    {
      icon: 'ti ti-settings-2',
      title: 'Other Settings',
      page: 'other-settings',
      expanded: false,
      subMenu: [],
    },
  ];
}
