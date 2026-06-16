import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PreScanApprovalComponent } from './pre-scan-approval/pre-scan-approval.component';
import { ReverificationComponent } from './reverification/reverification.component';

const routes: Routes = [
  {path: 'pre-scan-approval', component: PreScanApprovalComponent},
  {path: 'reverification', component: ReverificationComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeamLeadRoutingModule { }
