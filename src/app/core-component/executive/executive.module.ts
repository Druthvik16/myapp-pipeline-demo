import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExecutiveRoutingModule } from './executive-routing.module';
import { BucketModule } from './bucket/bucket.module';
import { ExecutiveDashboardComponent } from './executive-dashboard/executive-dashboard.component';
import { CnUpdationComponent } from './cn-updation/cn-updation.component';
import { NgbNavModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { UploadedDataComponent } from './uploaded-data/uploaded-data.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { ExcelStyleFilterComponent } from './excel-style-filter/excel-style-filter.component';
import { TrackerComponent } from './tracker/tracker.component';
import { BotLevelTrackerComponent } from './bot-level-tracker/bot-level-tracker.component';
import { FileLevelTrackerComponent } from './file-level-tracker/file-level-tracker.component';
import { FinalDataTrackerComponent } from './final-data-tracker/final-data-tracker.component';
import { UploadedDataPreviewComponent } from './uploaded-data-preview/uploaded-data-preview.component';
ModuleRegistry.registerModules([AllCommunityModule]);

@NgModule({
  declarations: [ExecutiveDashboardComponent, CnUpdationComponent, UploadedDataComponent, TrackerComponent, ExcelStyleFilterComponent, BotLevelTrackerComponent, FileLevelTrackerComponent, FinalDataTrackerComponent, UploadedDataPreviewComponent],
  imports: [
    CommonModule,
    ExecutiveRoutingModule,
    BucketModule,
    NgbNavModule,
    NgbModalModule,
    FormsModule,
    ReactiveFormsModule,
    sharedModule,
    AgGridModule
  ]
})
export class ExecutiveModule { }
