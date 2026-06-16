import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StoreListComponent } from './store-list/store-list.component';
import { HeaderAddComponent } from './header-add/header-add.component';
import { ReasonsListComponent } from './reasons-list/reasons-list.component';
import { ProductHeaderMappingLists } from './product-header-mapping-lists/product-header-mapping-lists';
import { ProductListsComponent } from './product-lists/product-lists.component';
import { ProductDetailsComponent } from './product-details/product-details.component';

const routes: Routes = [
  {path: "store", component: StoreListComponent},
  {path:"header-add", component: HeaderAddComponent},
  {path:"reasons", component: ReasonsListComponent},
  {path:"header-mapping", component: ProductHeaderMappingLists},
  {path: 'product-lists', component: ProductListsComponent},
  {path:'products-details/:uuid', component: ProductDetailsComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MasterRoutingModule { }
