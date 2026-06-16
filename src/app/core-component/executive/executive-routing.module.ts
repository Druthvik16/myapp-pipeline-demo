import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExecutiveDashboardComponent } from './executive-dashboard/executive-dashboard.component';
import { CnUpdationComponent } from './cn-updation/cn-updation.component';
import { UploadedDataComponent } from './uploaded-data/uploaded-data.component';
import { TrackerComponent } from './tracker/tracker.component';
import { BotLevelTrackerComponent } from './bot-level-tracker/bot-level-tracker.component';
import { FileLevelTrackerComponent } from './file-level-tracker/file-level-tracker.component';
import { FinalDataTrackerComponent } from './final-data-tracker/final-data-tracker.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: ExecutiveDashboardComponent,
  },
  {
    path: 'cn-updation',
    component: CnUpdationComponent,
  },
  {
    path: 'uploaded-data',
    component: UploadedDataComponent,
  },
  {
    path: 'tracker',
    component: TrackerComponent,
  },
  {
    path: 'bot-report',
    component: BotLevelTrackerComponent,
  },
  {
    path: 'file-report',
    component: FileLevelTrackerComponent,
  },
  {
    path: 'final-report',
    component: FinalDataTrackerComponent,
  },

  {
    path: 'bucket',
    loadChildren: () =>
      import('./bucket/bucket.module').then((m) => m.BucketModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExecutiveRoutingModule {}
