import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamLeadRoutingModule } from './team-lead-routing.module';
import { PreScanApprovalComponent } from './pre-scan-approval/pre-scan-approval.component';
import { ReverificationComponent } from './reverification/reverification.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { PreviewScanFileComponent } from './preview-scan-file/preview-scan-file.component';
import { ReverificationPreviewComponent } from './reverification-preview/reverification-preview.component';
import { ShowDuplicateComponent } from './show-duplicate/show-duplicate.component';
import { MarkModalComponent } from './mark-modal/mark-modal.component';
import { DuplicateFilePreviewComponent } from './duplicate-file-preview/duplicate-file-preview.component';
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { ExcelFilterComponent } from './excel-filter/excel-filter.component';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
ModuleRegistry.registerModules([AllCommunityModule]);

@NgModule({
  declarations: [PreScanApprovalComponent, ReverificationComponent, PreviewScanFileComponent,
   ReverificationPreviewComponent,
    ShowDuplicateComponent, MarkModalComponent,DuplicateFilePreviewComponent,
    ExcelFilterComponent
  ],
  imports: [
    CommonModule,
    TeamLeadRoutingModule,
    sharedModule,
    AgGridModule,
    BsDatepickerModule,
    TimepickerModule
  ]
})
export class TeamLeadModule { }
