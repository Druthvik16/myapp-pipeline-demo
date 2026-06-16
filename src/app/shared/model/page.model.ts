

export interface SideBarMenu {
  showMyTab?: boolean;
  menuValue: string;
  route?: string;
  hasSubRoute?: boolean;
  showSubRoute: boolean;
  icon: string;
  base?: string;
  base2?:string;
  base3?:string;
  base4?:string;
  base5?:string;
  base7?:string;
  base8?:string;
  base9?:string;
  base10?:string;
  last1?: string;
  last?: string;
  page?: string;
  last2?: string;
  materialicons?: string;
  subMenus: SubMenu[];
  dot?: boolean;
  changeLogVersion?: boolean;
  hasSubRouteTwo?: boolean;
  page1?: string;
}

export interface SubMenu {
  menuValue: string;
  route?: string;
  base?: string;
  page?: string;
  page1?: string;
  page2?: string;
  base2?: string;
  base3?: string;
  base4?: string;
  base5?: string;
  base6?: string;
  base7?: string;
  base8?: string;
  dot?:boolean;
  currentActive?: boolean;
  hasSubRoute?: boolean;
  showSubRoute?: boolean;
  customSubmenuTwo?: boolean;
  customSubmenuThree?: boolean;
  subMenusTwo?: SubMenu[];
  subMenusThree?: SubMenu[];
  tittle?:string;
}

export interface SideBar {
  showMyTab?: boolean;
  tittle: string;
  icon?: string;
  showAsTab: boolean;
  base?:string;
  base2?:string;
  separateRoute?: boolean;
  materialicons?: string;
  menu: SideBarMenu[];
  hasSubRoute?: boolean;
}