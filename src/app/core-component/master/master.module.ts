import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MasterRoutingModule } from './master-routing.module';
import { StoreListComponent } from './store-list/store-list.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { StoreAddComponent } from './store-add/store-add.component';
import { HeaderAddComponent } from './header-add/header-add.component';
import { UploadStoreComponent } from './upload-store/upload-store.component';
import { UploadHeaderComponent } from './upload-header/upload-header.component';
import { StoreEditComponent } from './store-edit/store-edit.component';
import { KeyMappingDeleteLogsComponent } from './key-mapping-delete-logs/key-mapping-delete-logs.component';
import { BulkBrandImportComponent } from './bulk-brand-import/bulk-brand-import.component';
import { ReasonsListComponent } from './reasons-list/reasons-list.component';
import { ReasonsAddComponent } from './reasons-add/reasons-add.component';
import { ProductHeaderMappingLists } from './product-header-mapping-lists/product-header-mapping-lists';
import { ProductHeaderMappingAdd } from './product-header-mapping-add/product-header-mapping-add';
import { NgSelectModule } from '@ng-select/ng-select';
import { UploadPortalMappingComponent } from './upload-portal-mapping/upload-portal-mapping.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductListsComponent } from './product-lists/product-lists.component';
import { ProductUploadComponent } from './product-upload/product-upload.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { AgGridModule } from 'ag-grid-angular';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

@NgModule({
  declarations: [StoreListComponent, StoreAddComponent, HeaderAddComponent, UploadStoreComponent,
    UploadHeaderComponent,
    StoreEditComponent, KeyMappingDeleteLogsComponent, BulkBrandImportComponent, ReasonsListComponent, ReasonsAddComponent, ProductHeaderMappingLists, ProductHeaderMappingAdd, UploadPortalMappingComponent, ProductListsComponent, ProductUploadComponent, ProductDetailsComponent
  ],
  imports: [
    CommonModule,
    MasterRoutingModule,
    sharedModule,
    NgSelectModule,
    ReactiveFormsModule,
    AgGridModule,
    FormsModule
  ]
})
export class MasterModule { }
