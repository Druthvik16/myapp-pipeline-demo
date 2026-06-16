import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BucketRoutingModule } from './bucket-routing.module';
import { FormattedComponent } from './formatted/formatted.component';
import { UnformattedComponent } from './unformatted/unformatted.component';
import { DataFormatterComponent } from './data-formatter/data-formatter.component';
import { HeaderMappingComponent } from './header-mapping/header-mapping.component';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { sharedModule } from 'src/app/shared/shared.module';
import { HeaderMappingFormatterComponent } from './header-mapping-formatter/header-mapping-formatter.component';
import { RejectedComponent } from './rejected/rejected.component';
import { RejectedPreviewComponent } from './rejected-preview/rejected-preview.component';
import { UploadedComponent } from './uploaded/uploaded.component';
import { UploadedPreviewComponent } from './uploaded-preview/uploaded-preview.component';
import { ApprovedComponent } from './approved/approved.component';
import { ApprovedPreviewComponent } from './approved-preview/approved-preview.component';
import { ScanningProcessComponent } from './scanning-process/scanning-process.component';
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { ExcelStyleFilterComponent } from './excel-style-filter/excel-style-filter.component';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
ModuleRegistry.registerModules([AllCommunityModule]);
import { DiscountBucketComponent } from './discount-bucket/discount-bucket.component';
import { DiscountBucketPreviewComponent } from './discount-bucket-preview/discount-bucket-preview.component';
import { DeletedComponent } from './deleted/deleted.component';
import { DeletedPreviewComponent } from './deleted-preview/deleted-preview.component';

@NgModule({
  declarations: [FormattedComponent, UnformattedComponent,
    DataFormatterComponent,HeaderMappingComponent,
    HeaderMappingFormatterComponent, RejectedComponent,
    RejectedPreviewComponent, UploadedComponent, UploadedPreviewComponent,
    ApprovedComponent, ApprovedPreviewComponent, ScanningProcessComponent,
    DiscountBucketComponent, DiscountBucketPreviewComponent,
    ExcelStyleFilterComponent,
    DeletedComponent,
    DeletedPreviewComponent
  ],
  imports: [
    CommonModule,
    BucketRoutingModule,
    NgbNavModule,
    sharedModule,
    AgGridModule,
    FormsModule,
    NgbModule,
    BsDatepickerModule,
    TimepickerModule
  ]
})
export class BucketModule { }
